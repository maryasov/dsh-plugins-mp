/**
 * Host HTTP surface (web profiles only, mounted through the dynamic
 * ctx.inject(['webServer']) pattern — headless profiles skip it):
 *
 * - GET  /plugins/dsh-plugins-mp/host    → { dsh: { version } | null }
 * - GET  /plugins/dsh-plugins-mp/config  → { apiBase } — resolved backend the
 *   browser half should use (host resolves config/env/.env once, browser is
 *   same-origin to it).
 * - POST /plugins/dsh-plugins-mp/install → body { slug, profile, dry? };
 *   resolves the install source from the marketplace API and re-invokes the
 *   `dsh plugin` CLI (child_process, NOT ctx.shell: the agent shell is a
 *   sandboxed executor that denies profile writes — same reasoning as
 *   dsh-market). One install at a time.
 * - GET  /plugins/dsh-plugins-mp/settings → { agentTools }
 * - POST /plugins/dsh-plugins-mp/settings → body { agentTools }: flips the
 *   model-facing tools live through the runtime.
 * - GET  /plugins/dsh-plugins-mp/logs → sanitized plain-text event log.
 */
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { CONFIG_ROUTE, fetchDetail, installSourceFor, resolveApiBase, type MpApiConfig } from './api.js'
import { dshHostInfo } from './host-info.js'
import {
  installedSpec,
  installedVersion,
  isPackageOnDisk,
  npmLatestVersion,
  parseIgnoredBuilds,
  readInstalled,
} from './installed.js'
import { exportLog, logEvent } from './log.js'
import { resolveProfileDir } from './mp-home.js'
import type { MpRuntime } from './runtime.js'
import { allowBuildsAdd } from './workspace-yaml.js'

export const HOST_ROUTE = '/plugins/dsh-plugins-mp/host'
export const INSTALL_ROUTE = '/plugins/dsh-plugins-mp/install'
export const SETTINGS_ROUTE = '/plugins/dsh-plugins-mp/settings'
export const LOGS_ROUTE = '/plugins/dsh-plugins-mp/logs'
export const INSTALLED_ROUTE = '/plugins/dsh-plugins-mp/installed'
export const UNINSTALL_ROUTE = '/plugins/dsh-plugins-mp/uninstall'
export const UPDATE_ROUTE = '/plugins/dsh-plugins-mp/update'
export const APPROVE_BUILDS_ROUTE = '/plugins/dsh-plugins-mp/approve-builds'
export const HEALTH_ROUTE = '/plugins/dsh-plugins-mp/health'
export const SETUP_PNPM_ROUTE = '/plugins/dsh-plugins-mp/setup-pnpm'

const INSTALL_TIMEOUT_MS = 10 * 60_000
const MAX_OUTPUT_CHARS = 20_000

interface NodeReq {
  headers?: Record<string, string | string[] | undefined>
  url?: string
  method?: string
  on(event: 'data', cb: (chunk: Buffer) => void): void
  on(event: 'end' | 'close', cb: () => void): void
}
interface NodeRes {
  writeHead(status: number, headers: Record<string, string>): void
  end(body?: string): void
}

export interface WebServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (req: NodeReq, res: NodeRes) => void | Promise<void>
  }): () => void
}

/** Same-origin guard for mutating requests (adapted from dsh-sentinel). */
export function requestAllowed(req: NodeReq): boolean {
  const headers = req.headers
  if (headers === undefined) return true
  const read = (name: string): string | undefined => {
    const value = headers[name]
    return Array.isArray(value) ? value[0] : value
  }
  const site = read('sec-fetch-site')
  if (site === 'cross-site') return false
  const origin = read('origin')
  const host = read('host')
  const browserMarked = site !== undefined || (origin !== undefined && origin !== 'null')
  if (!browserMarked) return true
  if (origin !== undefined && origin !== 'null') {
    try {
      return new URL(origin).host === (host ?? '')
    } catch {
      return false
    }
  }
  return true
}

const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/
const PACKAGE_RE = /^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]{0,119}$/
const PROFILE_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/

function readBody(req: NodeReq): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8')
      if (body.length > 10_000) body = ''
    })
    req.on('end', () => resolve(body))
    req.on('close', () => resolve(body))
  })
}

export interface InstallOutcome {
  ok: boolean
  code: number | null
  command: string
  source: string
  output: string
  timedOut: boolean
  /** Package names pnpm blocked build scripts for during this run. */
  ignoredBuilds?: string[]
  /** Post-install verification: the package is materialized in the profile. */
  verified?: boolean | null
  /** The dependency name the install added, when it could be determined. */
  installedName?: string | null
}

/**
 * Как dsh-market (src/dsh-cli.ts): предпочтительный способ запуска CLI —
 * переиспользовать энтри ЗАПУЩЕННОГО dsh (process.argv[1], обычно
 * apps/cli/src/bin.ts): версия и окружение гарантированно совпадают с хостом,
 * и мы не зависим от шима ~/.local/bin/dsh, жёстко подменяющего PATH.
 * Фолбэки: `dsh` из PATH, затем ~/.local/bin/dsh.
 */
interface DshCommand {
  argv: string[]
  cwd?: string
  label: string
}

/** Каталог, из которого разрешится `--import tsx/esm` (корень чекаута с node_modules). */
function moduleRootFor(entry: string): string {
  let dir = dirname(entry)
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'node_modules', 'tsx'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return dirname(entry)
}

export function dshCommands(): DshCommand[] {
  const cmds: DshCommand[] = []
  const override = process.env.DSH_MP_DSH_BIN
  if (override) cmds.push({ argv: [override], label: override })
  const entry = process.argv[1] ?? ''
  if (/(?:bin\.(?:js|ts)|dsh)$/.test(entry)) {
    cmds.push({
      argv: [process.execPath, ...process.execArgv, entry],
      cwd: moduleRootFor(entry),
      label: `node … ${entry}`,
    })
  }
  cmds.push({ argv: ['dsh'], label: 'dsh (PATH)' })
  cmds.push({ argv: [join(homedir(), '.local', 'bin', 'dsh')], label: '~/.local/bin/dsh' })
  return cmds
}

/**
 * PATH-repair (dsh-market spawnEnv): у процесса, обслуживающего плагин
 * (systemd-юнит, GUI-лаунчер), PATH урезан, а `pnpm` может разрешиться в
 * corepack-шим со старой дефолтной версией — тогда установка в профиль идёт
 * чужим pnpm и падает ERR_PNPM_UNEXPECTED_STORE (store v10 против v11).
 * Поэтому /usr/sbin (реальный pnpm 11) ставим раньше shim-каталогов.
 * CI=true — pnpm не ждёт ответа на TTY-вопросах в headless-окружении.
 */
function spawnEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `/usr/sbin:${dirname(process.execPath)}:${process.env.PATH ?? ''}`,
    CI: 'true',
    GIT_TERMINAL_PROMPT: '0',
  }
}

/**
 * One `dsh plugin --profile <profile> <args…>` invocation — the shared
 * executor behind install, uninstall and update. The CLI forwards the args
 * to pnpm in the profile directory and reconciles its bundle list.
 */
export function runDshPlugin(
  profile: string,
  pnpmArgs: readonly string[],
  timeoutMs = INSTALL_TIMEOUT_MS,
): Promise<InstallOutcome> {
  const command = `dsh plugin --profile ${profile} ${pnpmArgs.join(' ')}`
  const source = pnpmArgs[pnpmArgs.length - 1] ?? ''
  const commands = dshCommands()
  const env = spawnEnv()
  return new Promise((resolve) => {
    let output = ''
    let timedOut = false
    const collect = (buf: Buffer): void => {
      output += buf.toString('utf8')
      if (output.length > MAX_OUTPUT_CHARS) output = output.slice(-MAX_OUTPUT_CHARS)
    }
    const attempt = (index: number): void => {
      if (index >= commands.length) {
        resolve({
          ok: false,
          code: null,
          command,
          source,
          output: `dsh CLI not found (tried: ${commands.map((c) => c.label).join(', ')}). ` +
            'Set DSH_MP_DSH_BIN or put dsh on the PATH of the DSH process.',
          timedOut: false,
        })
        return
      }
      const cmd = commands[index]
      let timer: ReturnType<typeof setTimeout> | undefined
      const child = spawn(cmd.argv[0], [...cmd.argv.slice(1), 'plugin', '--profile', profile, ...pnpmArgs], {
        cwd: cmd.cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      child.stdout?.on('data', collect)
      child.stderr?.on('data', collect)
      // ENOENT → this binary is missing in the serving environment: fall
      // through to the next candidate instead of failing the install.
      child.on('error', (error: NodeJS.ErrnoException) => {
        if (timer) clearTimeout(timer)
        if (error.code === 'ENOENT' && index < commands.length - 1) {
          child.removeAllListeners('close')
          attempt(index + 1)
          return
        }
        resolve({ ok: false, code: null, command, source, output: `${output}\n${String(error)}`.trim(), timedOut })
      })
      timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGKILL')
      }, timeoutMs)
      child.on('close', (code) => {
        if (timer) clearTimeout(timer)
        const trimmed = output.trim()
        resolve({
          ok: code === 0 && !timedOut,
          code,
          command,
          source,
          output: trimmed,
          timedOut,
          ignoredBuilds: parseIgnoredBuilds(trimmed),
        })
      })
    }
    attempt(0)
  })
}

/** Install one marketplace source into a profile. */
export function runDshPluginAdd(
  profile: string,
  source: string,
  timeoutMs = INSTALL_TIMEOUT_MS,
): Promise<InstallOutcome> {
  return runDshPlugin(profile, ['add', source], timeoutMs)
}

/** Run plain `pnpm <args>` in the profile directory with the repaired env. */
export function runPnpm(
  profileDir: string,
  args: readonly string[],
  timeoutMs = INSTALL_TIMEOUT_MS,
): Promise<{ ok: boolean; output: string }> {
  const env = spawnEnv()
  return new Promise((resolve) => {
    let output = ''
    const collect = (buf: Buffer): void => {
      output += buf.toString('utf8')
      if (output.length > MAX_OUTPUT_CHARS) output = output.slice(-MAX_OUTPUT_CHARS)
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const child = spawn('pnpm', [...args], { cwd: profileDir, env, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout?.on('data', collect)
    child.stderr?.on('data', collect)
    child.on('error', (error) => {
      if (timer) clearTimeout(timer)
      resolve({ ok: false, output: `${output}\n${String(error)}`.trim() })
    })
    timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ ok: false, output: `${output}\ntimed out`.trim() })
    }, timeoutMs)
    child.on('close', (code) => {
      if (timer) clearTimeout(timer)
      resolve({ ok: code === 0, output: output.trim() })
    })
  })
}

/** The names of currently running host agents, for the mutation guard. */
function runningAgentIdsOf(ctx: { get?: (name: string) => unknown }): string[] {
  try {
    const service = ctx.get?.('agents') as { list?: () => unknown } | undefined
    const listed = service?.list?.()
    if (!Array.isArray(listed)) return []
    const ids: string[] = []
    for (const agent of listed) {
      if (agent === null || typeof agent !== 'object') continue
      const record = agent as { id?: unknown; status?: unknown }
      if (record.status !== 'running') continue
      ids.push(typeof record.id === 'string' && record.id !== '' ? record.id : 'agent')
    }
    return ids
  } catch {
    // A half-disposed registry must never take the routes down (fail open).
    return []
  }
}

/**
 * The mutation guard: installing or removing packages swaps files a live
 * agent may still be reading or lazily importing. Returns the 409 body when
 * an agent is mid-turn, null when mutations may proceed.
 */
function mutatingBlock(ctx: { get?: (name: string) => unknown }): { error: string; agents: string[] } | null {
  const agents = runningAgentIdsOf(ctx)
  if (agents.length === 0) return null
  return {
    error: `an agent session is running (${agents.join(', ')}) — plugin changes are paused until it finishes`,
    agents,
  }
}

export function mountRoutes(ctx: {
  inject: (deps: string[], fn: (sctx: never) => unknown) => unknown
  /** Cordis context read (agents inventory) when the host exposes it. */
  get?: (name: string) => unknown
}, config: MpApiConfig & { profile?: string } = {}, runtime?: MpRuntime): void {
  const apiBase = resolveApiBase(config)
  let installing = false

  const resolveCommand = async (slug: string, profile: string): Promise<{ command: string; source: string } | null> => {
    try {
      const detail = await fetchDetail(apiBase, slug, AbortSignal.timeout(15_000))
      const source = installSourceFor(detail.plugin)
      return { command: `dsh plugin --profile ${profile} add ${source}`, source }
    } catch {
      return null
    }
  }

  ctx.inject(['webServer'], (sctx: { effect: (fn: () => (() => void) | void, label?: string) => unknown; webServer?: WebServerLike }) => {
    sctx.effect(() => {
      const webServer = sctx.webServer
      if (webServer === undefined) return () => {}
      const json = (res: NodeRes, status: number, body: unknown): void => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(body))
      }

      const stopHost = webServer.register({
        kind: 'exact',
        path: HOST_ROUTE,
        handler: (_req, res) => {
          json(res, 200, { dsh: dshHostInfo() })
        },
      })

      // Expose the resolved backend so the browser half (which can't read
      // config/.env/process.env) fetches from the same API it should talk to.
      const stopConfig = webServer.register({
        kind: 'exact',
        path: CONFIG_ROUTE,
        handler: (_req, res) => {
          json(res, 200, { apiBase })
        },
      })

      const stopInstall = webServer.register({
        kind: 'exact',
        path: INSTALL_ROUTE,
        handler: async (req, res) => {
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          let body: { slug?: unknown; profile?: unknown; dry?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const slug = typeof body.slug === 'string' ? body.slug : ''
          const profile = typeof body.profile === 'string' && body.profile !== '' ? body.profile : 'web'
          if (!SLUG_RE.test(slug)) {
            json(res, 400, { error: 'invalid slug' })
            return
          }
          if (!PROFILE_RE.test(profile)) {
            json(res, 400, { error: 'invalid profile name' })
            return
          }
          const resolved = await resolveCommand(slug, profile)
          if (resolved === null) {
            json(res, 404, { error: `plugin "${slug}" not found in the marketplace` })
            return
          }
          if (body.dry === true) {
            json(res, 200, { ok: true, ...resolved, dry: true, output: '', code: null, timedOut: false })
            return
          }
          const blocked = mutatingBlock(ctx)
          if (blocked !== null) {
            json(res, 409, blocked)
            return
          }
          if (installing) {
            json(res, 409, { error: 'another install is already in progress' })
            return
          }
          installing = true
          try {
            const profileDir = resolveProfileDir({ profile })
            const before = new Set(readInstalled(profileDir).map((item) => item.name))
            const outcome = await runDshPluginAdd(profile, resolved.source)
            if (outcome.ok) {
              // Verified install = a (new) dependency whose manifest is on
              // disk. For github sources the true name only shows up in the
              // dependency diff; unresolvable keeps verified null.
              const added = readInstalled(profileDir).map((item) => item.name).filter((name) => !before.has(name))
              const isPlainSpec = /^[a-z0-9][a-z0-9._/-]*(@[^\s]+)?$/i.test(resolved.source)
              const installedName = added[0] ?? (isPlainSpec ? resolved.source.replace(/@[^\s/@]+$/, '') : null)
              outcome.installedName = installedName
              outcome.verified = installedName === null ? null : isPackageOnDisk(profileDir, installedName)
            }
            logEvent(outcome.ok ? 'info' : 'warn', 'install',
              `${resolved.source} → profile ${profile}: ${outcome.ok ? `ok${outcome.ignoredBuilds?.length ? `, blocked builds: ${outcome.ignoredBuilds.join(', ')}` : ''}` : `failed (code ${outcome.code}${outcome.timedOut ? ', timed out' : ''})`}`)
            json(res, 200, outcome)
          } catch (error) {
            logEvent('error', 'install', String(error instanceof Error ? error.message : error))
            json(res, 500, { error: String(error instanceof Error ? error.message : error) })
          } finally {
            installing = false
          }
        },
      })

      const stopSettings = webServer.register({
        kind: 'exact',
        path: SETTINGS_ROUTE,
        handler: async (req, res) => {
          if (req.method === 'GET') {
            json(res, 200, { agentTools: runtime?.agentToolsEnabled() ?? true })
            return
          }
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          if (runtime === undefined) {
            json(res, 503, { error: 'runtime is not available' })
            return
          }
          let body: { agentTools?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          if (typeof body.agentTools !== 'boolean') {
            json(res, 400, { error: 'agentTools must be a boolean' })
            return
          }
          runtime.setAgentTools(body.agentTools)
          logEvent('info', 'settings', `agent tools ${body.agentTools ? 'enabled' : 'disabled'}`)
          json(res, 200, { agentTools: runtime.agentToolsEnabled() })
        },
      })

      const stopLogs = webServer.register({
        kind: 'exact',
        path: LOGS_ROUTE,
        handler: (_req, res) => {
          res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
          res.end(exportLog())
        },
      })

      // ------------------------------------------------------------------
      // Installed-plugins surface (My plugins tab).
      // ------------------------------------------------------------------

      const stopInstalled = webServer.register({
        kind: 'exact',
        path: INSTALLED_ROUTE,
        handler: (_req, res) => {
          json(res, 200, { dsh: dshHostInfo(), items: readInstalled(resolveProfileDir(config)) })
        },
      })

      const stopUninstall = webServer.register({
        kind: 'exact',
        path: UNINSTALL_ROUTE,
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          let body: { name?: unknown; profile?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const name = typeof body.name === 'string' ? body.name : ''
          const profile = typeof body.profile === 'string' && body.profile !== '' ? body.profile : 'web'
          if (!PACKAGE_RE.test(name)) {
            json(res, 400, { error: 'invalid package name' })
            return
          }
          const blocked = mutatingBlock(ctx)
          if (blocked !== null) {
            json(res, 409, blocked)
            return
          }
          if (installing) {
            json(res, 409, { error: 'another install is already in progress' })
            return
          }
          installing = true
          try {
            const outcome = await runDshPlugin(profile, ['remove', name])
            logEvent(outcome.ok ? 'info' : 'warn', 'uninstall',
              `${name} from profile ${profile}: ${outcome.ok ? 'removed' : `failed (code ${outcome.code})`}`)
            json(res, 200, outcome)
          } finally {
            installing = false
          }
        },
      })

      const stopUpdate = webServer.register({
        kind: 'exact',
        path: UPDATE_ROUTE,
        handler: async (req, res) => {
          if (req.method === 'GET') {
            // Update scan: npm-installed packages only — link:/file:/github
            // sources have no registry truth to compare against.
            const profileDir = resolveProfileDir(config)
            const scan = await Promise.all(
              readInstalled(profileDir)
                .filter((item) => item.source === 'npm' && item.version !== null)
                .map(async (item) => ({
                  name: item.name,
                  current: item.version,
                  latest: await npmLatestVersion(item.name),
                }))
                .map(async (entry) => {
                  const e = await entry
                  return { ...e, updateAvailable: e.latest !== null && e.current !== null && e.latest !== e.current }
                }),
            )
            json(res, 200, { items: scan })
            return
          }
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          let body: { name?: unknown; profile?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const name = typeof body.name === 'string' ? body.name : ''
          const profile = typeof body.profile === 'string' && body.profile !== '' ? body.profile : 'web'
          if (!PACKAGE_RE.test(name)) {
            json(res, 400, { error: 'invalid package name' })
            return
          }
          const blocked = mutatingBlock(ctx)
          if (blocked !== null) {
            json(res, 409, blocked)
            return
          }
          if (installing) {
            json(res, 409, { error: 'another install is already in progress' })
            return
          }
          installing = true
          try {
            const outcome = await runDshPlugin(profile, ['add', `${name}@latest`])
            logEvent(outcome.ok ? 'info' : 'warn', 'update',
              `${name} in profile ${profile}: ${outcome.ok ? 'updated' : `failed (code ${outcome.code})`}`)
            json(res, 200, outcome)
          } finally {
            installing = false
          }
        },
      })

      const stopApproveBuilds = webServer.register({
        kind: 'exact',
        path: APPROVE_BUILDS_ROUTE,
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          let body: { packages?: unknown; profile?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const profile = typeof body.profile === 'string' && body.profile !== '' ? body.profile : 'web'
          const packages = Array.isArray(body.packages)
            ? body.packages.filter((item): item is string => typeof item === 'string' && PACKAGE_RE.test(item))
            : []
          if (packages.length === 0) {
            json(res, 400, { error: 'packages must be a non-empty array of package names' })
            return
          }
          try {
            const { added, file } = allowBuildsAdd(resolveProfileDir({ profile }), packages)
            logEvent('info', 'approve-builds', `allowed build scripts: ${added.join(', ')} (${file})`)
            json(res, 200, { ok: true, added, file })
          } catch (error) {
            json(res, 500, { error: String(error instanceof Error ? error.message : error) })
          }
        },
      })

      const stopHealth = webServer.register({
        kind: 'exact',
        path: HEALTH_ROUTE,
        handler: (_req, res) => {
          let settled = false
          const done = (body: unknown): void => {
            if (settled) return
            settled = true
            json(res, 200, body)
          }
          const child = spawn('pnpm', ['--version'], { env: spawnEnv(), stdio: ['ignore', 'pipe', 'pipe'] })
          let version = ''
          child.stdout?.on('data', (chunk: Buffer) => { version += chunk.toString('utf8') })
          child.on('error', () => done({ pnpm: { found: false }, dsh: dshCommands()[0]?.label ?? null }))
          const timer = setTimeout(() => { child.kill('SIGKILL'); done({ pnpm: { found: false }, dsh: dshCommands()[0]?.label ?? null }) }, 15_000)
          child.on('close', (code) => {
            clearTimeout(timer)
            done({
              pnpm: { found: code === 0, version: version.trim() || null },
              dsh: dshCommands()[0]?.label ?? null,
            })
          })
        },
      })

      const stopSetupPnpm = webServer.register({
        kind: 'exact',
        path: SETUP_PNPM_ROUTE,
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          // Global npm install — cwd-independent; npm must already exist
          // (it ships with the Node that runs DSH itself).
          const outcome = await new Promise<{ ok: boolean; output: string }>((resolve) => {
            let output = ''
            const collect = (buf: Buffer): void => {
              output += buf.toString('utf8')
              if (output.length > MAX_OUTPUT_CHARS) output = output.slice(-MAX_OUTPUT_CHARS)
            }
            const child = spawn('npm', ['install', '-g', 'pnpm@11'], { env: spawnEnv(), stdio: ['ignore', 'pipe', 'pipe'] })
            let timer: ReturnType<typeof setTimeout> | undefined
            child.stdout?.on('data', collect)
            child.stderr?.on('data', collect)
            child.on('error', (error) => {
              if (timer) clearTimeout(timer)
              resolve({ ok: false, output: `${output}\n${String(error)}`.trim() })
            })
            timer = setTimeout(() => {
              child.kill('SIGKILL')
              resolve({ ok: false, output: `${output}\ntimed out`.trim() })
            }, INSTALL_TIMEOUT_MS)
            child.on('close', (code) => {
              if (timer) clearTimeout(timer)
              resolve({ ok: code === 0, output: output.trim() })
            })
          })
          logEvent(outcome.ok ? 'info' : 'warn', 'setup-pnpm', outcome.ok ? 'pnpm installed globally' : `failed: ${outcome.output.slice(-200)}`)
          json(res, 200, outcome)
        },
      })

      return () => {
        stopHost()
        stopConfig()
        stopInstall()
        stopSettings()
        stopLogs()
        stopInstalled()
        stopUninstall()
        stopUpdate()
        stopApproveBuilds()
        stopHealth()
        stopSetupPnpm()
      }
    }, 'dsh-plugins-mp: host routes')
  })
}
