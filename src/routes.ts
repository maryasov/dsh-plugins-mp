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
import { existsSync, readFileSync } from 'node:fs'
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
import { cleanHotDir, hotMount, hotUnmount, listHotMounts, readUserPatchControls, patchLayerManages, rowIdFor } from './hot.js'
import type { MpRuntime } from './runtime.js'
import { snapshotCreate, snapshotDelete, snapshotList, snapshotRestore } from './snapshot.js'
import { isDisabledByPatch, setPatchDisabled } from './toggle.js'
import { statusFingerprint, successorPending, triggerRestart } from './restart.js'
import { allowBuildsAdd } from './workspace-yaml.js'
import { isValidGroupName, type MpGroup } from './store.js'
import { argvProfile } from './mp-home.js'
import {
  applyBundleOrder,
  mergeOrder,
  readBundleRules,
  readBundleStack,
  validateOrder,
  writeFileAtomic,
  type OrderConflict,
} from './order.js'

export const HOST_ROUTE = '/plugins/dsh-plugins-mp/host'
export const INSTALL_ROUTE = '/plugins/dsh-plugins-mp/install'
export const SETTINGS_ROUTE = '/plugins/dsh-plugins-mp/settings'
export const FAVORITE_ROUTE = '/plugins/dsh-plugins-mp/favorite'
export const NOTE_ROUTE = '/plugins/dsh-plugins-mp/note'
export const THEME_ROUTE = '/plugins/dsh-plugins-mp/theme'
export const LOGS_ROUTE = '/plugins/dsh-plugins-mp/logs'
export const INSTALLED_ROUTE = '/plugins/dsh-plugins-mp/installed'
export const UNINSTALL_ROUTE = '/plugins/dsh-plugins-mp/uninstall'
export const UPDATE_ROUTE = '/plugins/dsh-plugins-mp/update'
export const APPROVE_BUILDS_ROUTE = '/plugins/dsh-plugins-mp/approve-builds'
export const HEALTH_ROUTE = '/plugins/dsh-plugins-mp/health'
export const SETUP_PNPM_ROUTE = '/plugins/dsh-plugins-mp/setup-pnpm'
export const TOGGLE_ROUTE = '/plugins/dsh-plugins-mp/toggle'
export const GROUP_ROUTE = '/plugins/dsh-plugins-mp/group'
export const ORDER_ROUTE = '/plugins/dsh-plugins-mp/order'
export const SNAPSHOTS_ROUTE = '/plugins/dsh-plugins-mp/snapshots'
export const RESTORE_SNAPSHOT_ROUTE = '/plugins/dsh-plugins-mp/restore-snapshot'
export const STATUS_ROUTE = '/plugins/dsh-plugins-mp/status'
export const RESTART_ROUTE = '/plugins/dsh-plugins-mp/restart'
export const DIAGNOSTICS_ROUTE = '/plugins/dsh-plugins-mp/diagnostics'

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
  /** Live-mounted into the running composition (no restart needed). */
  hot?: boolean
  /** Why hot-mount did not happen (restart needed). */
  hotReason?: string
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

/** One arbitrary `dsh <args…>` invocation (boot trial: `--dump-config`). */
export function runDshCli(
  args: readonly string[],
  timeoutMs = INSTALL_TIMEOUT_MS,
): Promise<{ ok: boolean; code: number | null; output: string; timedOut: boolean }> {
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
        resolve({ ok: false, code: null, output: `dsh CLI not found (tried: ${commands.map((c) => c.label).join(', ')})`, timedOut })
        return
      }
      const cmd = commands[index]
      let timer: ReturnType<typeof setTimeout> | undefined
      const child = spawn(cmd.argv[0], [...cmd.argv.slice(1), ...args], { cwd: cmd.cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
      child.stdout?.on('data', collect)
      child.stderr?.on('data', collect)
      child.on('error', (error: NodeJS.ErrnoException) => {
        if (timer) clearTimeout(timer)
        if (error.code === 'ENOENT' && index < commands.length - 1) {
          child.removeAllListeners('close')
          attempt(index + 1)
          return
        }
        resolve({ ok: false, code: null, output: `${output}\n${String(error)}`.trim(), timedOut })
      })
      timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGKILL')
      }, timeoutMs)
      child.on('close', (code) => {
        if (timer) clearTimeout(timer)
        resolve({ ok: code === 0 && !timedOut, code, output: output.trim(), timedOut })
      })
    }
    attempt(0)
  })
}

/** Entry ids in composition order, parsed from a `dsh --dump-config` dump. */
function parseEntryIds(dump: string): string[] {
  const ids: string[] = []
  for (const m of dump.matchAll(/^\s*-\s*id:\s*['"]?([^'"\s]+)/gm)) ids.push(m[1] ?? '')
  return ids
}

/** The profile name for CLI invocations — same resolution as resolveProfileDir. */
function profileName(config: { profile?: string }): string {
  return config.profile ?? argvProfile() ?? 'web'
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

export type ToggleOneResult =
  | { ok: true; live: boolean; restartNeeded?: boolean; reason?: string }
  | { ok: false; conflict: boolean; error: string }

/**
 * Enable/disable ONE installed plugin — the shared core behind the single
 * toggle route and group toggles (#15): a live hot mount goes down/up
 * immediately, the managed patch row decides the next boot, and a row the
 * user patch manages itself is reported as a conflict instead of fought over.
 */
async function toggleOne(
  ctx: Parameters<typeof hotMount>[0],
  profileDir: string,
  name: string,
  disable: boolean,
): Promise<ToggleOneResult> {
  const userControls = readUserPatchControls(profileDir)
  const hotLive = listHotMounts().includes(name)
  let live = hotLive
  if (disable) {
    if (hotLive) live = !(await hotUnmount(name))
    const patch = setPatchDisabled(profileDir, name, true)
    if (patch.conflict === true) {
      return { ok: false, conflict: true, error: `the patch layer already manages a row for ${name} — edit cordis.patch.yml by hand` }
    }
    live = false
  } else {
    const patch = setPatchDisabled(profileDir, name, false)
    if (patch.conflict === true) {
      return { ok: false, conflict: true, error: `the patch layer already manages a row for ${name} — edit cordis.patch.yml by hand` }
    }
    if (!patchLayerManages(userControls, name)) {
      // Not patch-managed: the watcher will not re-apply it — mount
      // live unless it is already hot-live.
      if (!hotLive) {
        const mount = await hotMount(ctx, profileDir, name)
        live = mount.ok
        if (!mount.ok) return { ok: true, live: false, restartNeeded: true, reason: mount.reason }
      }
    }
  }
  logEvent('info', 'toggle', `${name}: ${disable ? 'off' : 'on'} (live=${String(live)})`)
  return { ok: true, live, restartNeeded: false }
}

export function mountRoutes(ctx: {
  inject: (deps: string[], fn: (sctx: never) => unknown) => unknown
  /** Cordis context read (agents inventory) when the host exposes it. */
  get?: (name: string) => unknown
  /** Cordis child-fiber mount — the hot-mount subtree anchor. */
  plugin?: (plugin: unknown, config: unknown) => { await(): Promise<unknown>; dispose(): Promise<unknown> | void }
}, config: MpApiConfig & { profile?: string } = {}, runtime?: MpRuntime): void {
  const apiBase = resolveApiBase(config)
  let installing = false

  const resolveCommand = async (
    slug: string,
    profile: string,
  ): Promise<{ command: string; source: string; fallback: string | null } | null> => {
    try {
      const detail = await fetchDetail(apiBase, slug, AbortSignal.timeout(15_000))
      const source = installSourceFor(detail.plugin)
      // Данные каталога бывают протухшими (npmPackage отсутствует в registry) —
      // держим github-источник как запасной для ретрая.
      const fallback =
        detail.plugin.repoOwner && detail.plugin.repoName
          ? `github:${detail.plugin.repoOwner}/${detail.plugin.repoName}`
          : null
      return {
        command: `dsh plugin --profile ${profile} add ${source}`,
        source,
        fallback: fallback !== null && fallback !== source ? fallback : null,
      }
    } catch {
      return null
    }
  }

  ctx.inject(['webServer'], (sctx: { effect: (fn: () => (() => void) | void, label?: string) => unknown; webServer?: WebServerLike }) => {
    sctx.effect(() => {
      const webServer = sctx.webServer
      if (webServer === undefined) return () => {}
      // Leftover hot-mount inputs from a crashed session must never collide
      // with the bundle layer; state.json survives the wipe.
      try { cleanHotDir(resolveProfileDir(config)) } catch { /* profile may not exist yet */ }
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
            snapshotCreate(profileDir, `before install ${resolved.source}`)
            let outcome = await runDshPluginAdd(profile, resolved.source)
            if (!outcome.ok && resolved.fallback !== null) {
              // npm-источник не поднялся (404/недоступен) — второй заход через github.
              logEvent('info', 'install', `${resolved.source} failed — retrying via ${resolved.fallback}`)
              const retried = await runDshPluginAdd(profile, resolved.fallback)
              if (retried.ok) {
                outcome = retried
              } else {
                outcome.output = `${outcome.output}\n— retry via ${resolved.fallback} also failed (code ${retried.code}${retried.timedOut ? ', timed out' : ''})`
              }
            }
            if (outcome.ok) {
              // Verified install = a (new) dependency whose manifest is on
              // disk. For github sources the true name only shows up in the
              // dependency diff; unresolvable keeps verified null.
              const added = readInstalled(profileDir).map((item) => item.name).filter((name) => !before.has(name))
              const isPlainSpec = /^[a-z0-9][a-z0-9._/-]*(@[^\s]+)?$/i.test(resolved.source)
              const installedName = added[0] ?? (isPlainSpec ? resolved.source.replace(/@[^\s/@]+$/, '') : null)
              outcome.installedName = installedName
              outcome.verified = installedName === null ? null : isPackageOnDisk(profileDir, installedName)
              // Live activation: mount the freshly installed package into the
              // running composition; a non-plain patch falls back to restart.
              if (installedName !== null && ctx.plugin !== undefined) {
                const hot = await hotMount(ctx as Parameters<typeof hotMount>[0], profileDir, installedName)
                outcome.hot = hot.ok
                if (!hot.ok) outcome.hotReason = hot.reason ?? undefined
              }
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

      // Favorites (plan 3.2): durable slug list in state.json. GET returns
      // the list, POST { slug, on } flips one entry (same-origin enforced).
      const stopFavorite = webServer.register({
        kind: 'exact',
        path: FAVORITE_ROUTE,
        handler: async (req, res) => {
          if (req.method === 'GET') {
            json(res, 200, { favorites: runtime?.getState().favorites ?? [] })
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
          let body: { slug?: unknown; on?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const slug = typeof body.slug === 'string' ? body.slug : ''
          if (!SLUG_RE.test(slug)) {
            json(res, 400, { error: 'invalid slug' })
            return
          }
          const on = body.on !== false
          const prev = runtime.getState().favorites
          const favorites = on
            ? prev.includes(slug)
              ? prev
              : [...prev, slug]
            : prev.filter((item) => item !== slug)
          runtime.updateState({ favorites })
          logEvent('info', 'favorite', `${on ? '+' : '-'} ${slug}`)
          json(res, 200, { favorites })
        },
      })

      // Notes (plan #21, v1 local): slug → free-form text in state.json.
      // GET returns the map; POST { slug, text } sets one (empty text removes).
      const stopNote = webServer.register({
        kind: 'exact',
        path: NOTE_ROUTE,
        handler: async (req, res) => {
          if (req.method === 'GET') {
            json(res, 200, { notes: runtime?.getState().notes ?? {} })
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
          let body: { slug?: unknown; text?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const slug = typeof body.slug === 'string' ? body.slug : ''
          if (!SLUG_RE.test(slug)) {
            json(res, 400, { error: 'invalid slug' })
            return
          }
          if (typeof body.text !== 'string') {
            json(res, 400, { error: 'text must be a string' })
            return
          }
          const notes = { ...runtime.getState().notes }
          const text = body.text.trim()
          if (text === '') delete notes[slug]
          else notes[slug] = text.slice(0, 2000)
          runtime.updateState({ notes })
          logEvent('info', 'note', `${text === '' ? '-' : '+'} ${slug}`)
          json(res, 200, { notes })
        },
      })

      // Themes (plan #23): remember which theme plugin is active so the
      // client's switch flow can auto-disable it. GET → { active }, POST
      // { slug, name } sets one, POST { slug: null } clears.
      const stopTheme = webServer.register({
        kind: 'exact',
        path: THEME_ROUTE,
        handler: async (req, res) => {
          if (req.method === 'GET') {
            json(res, 200, { active: runtime?.getState().theme ?? null })
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
          let body: { slug?: unknown; name?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          if (body.slug === null) {
            runtime.updateState({ theme: null })
            json(res, 200, { active: null })
            return
          }
          const slug = typeof body.slug === 'string' ? body.slug : ''
          const name = typeof body.name === 'string' ? body.name : ''
          if (!SLUG_RE.test(slug) || !SLUG_RE.test(name)) {
            json(res, 400, { error: 'invalid slug or name' })
            return
          }
          const theme = { slug, name }
          runtime.updateState({ theme })
          logEvent('info', 'theme', `active: ${slug} (${name})`)
          json(res, 200, { active: theme })
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
            const profileDir = resolveProfileDir({ profile })
            snapshotCreate(profileDir, `before uninstall ${name}`)
            await hotUnmount(name)
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
            snapshotCreate(resolveProfileDir({ profile }), `before update ${name}`)
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
        handler: (_req: NodeReq, res: NodeRes) => {
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

      // ------------------------------------------------------------------
      // Live composition: toggle, snapshots, restart, diagnostics.
      // ------------------------------------------------------------------

      const stopToggle = webServer.register({
        kind: 'exact',
        path: TOGGLE_ROUTE,
        handler: async (req, res) => {
          if (req.method === 'GET') {
            const profileDir = resolveProfileDir(config)
            const items = readInstalled(profileDir)
            const hot = listHotMounts()
            json(res, 200, {
              hot,
              items: items.map((item) => ({
                name: item.name,
                disabled: isDisabledByPatch(profileDir, item.name),
                live: hot.includes(item.name),
              })),
            })
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
          let body: { name?: unknown; disable?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const name = typeof body.name === 'string' ? body.name : ''
          const disable = body.disable === true
          if (!PACKAGE_RE.test(name)) {
            json(res, 400, { error: 'invalid package name' })
            return
          }
          if (ctx.plugin === undefined) {
            json(res, 503, { error: 'hot composition surface is unavailable in this host' })
            return
          }
          const result = await toggleOne(ctx as Parameters<typeof hotMount>[0], resolveProfileDir(config), name, disable)
          if (!result.ok) {
            json(res, 409, { error: result.error })
            return
          }
          json(res, 200, result)
        },
      })

      // Groups (plan #15): named sets of installed packages toggled as one
      // unit. GET → { groups }; POST { action, name, member?, disable? } with
      // action ∈ create | delete | add | remove | toggle.
      const stopGroup = webServer.register({
        kind: 'exact',
        path: GROUP_ROUTE,
        handler: async (req, res) => {
          if (req.method === 'GET') {
            json(res, 200, { groups: runtime?.getState().groups ?? [] })
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
          let body: { action?: unknown; name?: unknown; member?: unknown; disable?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const action = typeof body.action === 'string' ? body.action : ''
          const name = typeof body.name === 'string' ? body.name.trim() : ''
          if (!['create', 'delete', 'add', 'remove', 'toggle'].includes(action)) {
            json(res, 400, { error: 'action must be one of create/delete/add/remove/toggle' })
            return
          }
          if (!isValidGroupName(name)) {
            json(res, 400, { error: 'invalid group name' })
            return
          }
          const groups: MpGroup[] = runtime.getState().groups.map((g) => ({ ...g, members: [...g.members] }))
          const group = groups.find((g) => g.name.toLowerCase() === name.toLowerCase())

          if (action === 'create') {
            if (group !== undefined) {
              json(res, 409, { error: `group "${name}" already exists` })
              return
            }
            groups.push({ name, members: [] })
          } else if (group === undefined) {
            json(res, 404, { error: `group "${name}" not found` })
            return
          } else if (action === 'delete') {
            groups.splice(groups.indexOf(group), 1)
          } else if (action === 'add' || action === 'remove') {
            const member = typeof body.member === 'string' ? body.member : ''
            if (!PACKAGE_RE.test(member)) {
              json(res, 400, { error: 'invalid package name' })
              return
            }
            if (action === 'add') {
              if (!group.members.includes(member) && group.members.length >= 50) {
                json(res, 409, { error: 'group is full (50 members max)' })
                return
              }
              if (!group.members.includes(member)) group.members.push(member)
            } else {
              group.members = group.members.filter((m) => m !== member)
            }
          } else if (action === 'toggle') {
            if (ctx.plugin === undefined) {
              json(res, 503, { error: 'hot composition surface is unavailable in this host' })
              return
            }
            const disable = body.disable === true
            const installed = new Set(readInstalled(resolveProfileDir(config)).map((item) => item.name))
            const results: Array<{ name: string; ok: boolean; live?: boolean; skipped?: boolean; error?: string; restartNeeded?: boolean }> = []
            for (const member of group.members) {
              if (!installed.has(member)) {
                results.push({ name: member, ok: true, skipped: true })
                continue
              }
              const r = await toggleOne(ctx as Parameters<typeof hotMount>[0], resolveProfileDir(config), member, disable)
              results.push(r.ok ? { name: member, ok: true, live: r.live, restartNeeded: r.restartNeeded } : { name: member, ok: false, error: r.error })
            }
            const restartNeeded = results.some((r) => r.restartNeeded === true)
            logEvent('info', 'group', `${name}: ${disable ? 'off' : 'on'} (${results.filter((r) => r.ok && !r.skipped).length}/${group.members.length} applied)`)
            json(res, 200, { ok: true, results, restartNeeded })
            return
          }

          runtime.updateState({ groups })
          logEvent('info', 'group', `${action} "${name}"`)
          json(res, 200, { groups })
        },
      })

      // Bundle load order (plan #16): GET returns the stack + rule conflicts
      // of the CURRENT order; POST { order } reorders the community bundles
      // (in-box bundles stay put). The candidate is trial-composed with the
      // REAL boot (`dsh --dump-config`) after the manifest write — on failure
      // the previous manifest text is restored atomically, so a broken order
      // can never survive.
      const stopOrder = webServer.register({
        kind: 'exact',
        path: ORDER_ROUTE,
        handler: async (req, res) => {
          const profileDir = resolveProfileDir(config)
          const trial = async (): Promise<{ ok: boolean; output: string }> => {
            const r = await runDshCli(['--dump-config', '--profile', profileName(config)], 120_000)
            return { ok: r.ok, output: r.output }
          }
          if (req.method === 'GET') {
            const stack = readBundleStack(profileDir)
            json(res, 200, {
              bundles: stack.bundles,
              community: stack.community,
              conflicts: validateOrder(stack.bundles, readBundleRules(profileDir)),
            })
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
          let body: { order?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const order = Array.isArray(body.order)
            ? body.order.filter((item): item is string => typeof item === 'string')
            : []
          if (order.length === 0) {
            json(res, 400, { error: 'order must be a non-empty array of bundle names' })
            return
          }

          // The reorder writes package.json directly — same mutex as installs
          // so a concurrent pnpm run can never interleave.
          if (installing) {
            json(res, 409, { error: 'another install is already in progress' })
            return
          }
          installing = true
          try {
            const stack = readBundleStack(profileDir)
            const merged = mergeOrder(stack.bundles, order)
            if (!merged.ok) {
              json(res, 400, { error: merged.error })
              return
            }
            const conflicts: OrderConflict[] = validateOrder(merged.bundles, readBundleRules(profileDir))
            if (conflicts.length > 0) {
              json(res, 422, { error: 'the order violates declared before/after rules', conflicts })
              return
            }
            if (merged.bundles.join('\u0000') === stack.bundles.join('\u0000')) {
              json(res, 200, { ok: true, unchanged: true, bundles: stack.bundles })
              return
            }

            // Composition entry order BEFORE, for the what-changed report.
            const beforeDump = await trial()
            const beforeIds = beforeDump.ok ? parseEntryIds(beforeDump.output) : []

            snapshotCreate(profileDir, 'before bundle order')
            const manifestPath = join(profileDir, 'package.json')
            const originalText = readFileSync(manifestPath, 'utf8')
            const applied = applyBundleOrder(profileDir, order)
            if (!applied.ok) {
              json(res, 400, { error: applied.error })
              return
            }

            // Boot trial on the real machinery. Fail → restore the original
            // manifest text and refuse; the profile is never left broken.
            const after = await trial()
            if (!after.ok) {
              writeFileAtomic(manifestPath, originalText)
              logEvent('warn', 'order', `rejected by boot trial — manifest restored`)
              json(res, 422, {
                error: 'trial composition failed — the order was rolled back',
                output: after.output.slice(-2000),
              })
              return
            }

            // What changed: entry ids whose position the reorder moved.
            const afterIds = parseEntryIds(after.output)
            const beforePos = new Map(beforeIds.map((id, i) => [id, i]))
            const moved = afterIds.filter((id, i) => beforePos.get(id) !== i)
            logEvent('info', 'order', `applied community order (${moved.length} entries moved)`)
            // The running composition keeps the old order until a restart.
            json(res, 200, { ok: true, bundles: applied.bundles, moved, restartNeeded: true })
          } catch (error) {
            json(res, 500, { error: String(error instanceof Error ? error.message : error) })
          } finally {
            installing = false
          }
        },
      })

      const stopSnapshots = webServer.register({
        kind: 'exact',
        path: SNAPSHOTS_ROUTE,
        handler: (_req, res) => {
          json(res, 200, { items: snapshotList(resolveProfileDir(config)) })
        },
      })

      const stopRestoreSnapshot = webServer.register({
        kind: 'exact',
        path: RESTORE_SNAPSHOT_ROUTE,
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          let body: { id?: unknown } = {}
          try {
            body = JSON.parse((await readBody(req)) || '{}')
          } catch {
            json(res, 400, { error: 'invalid JSON body' })
            return
          }
          const id = typeof body.id === 'string' ? body.id : ''
          const result = snapshotRestore(resolveProfileDir(config), id)
          if (!result.ok) {
            json(res, 400, { error: result.error ?? 'restore failed' })
            return
          }
          logEvent('info', 'snapshot', `restored ${id}; restart to apply`)
          json(res, 200, { ok: true, restartNeeded: true })
        },
      })

      const stopStatus = webServer.register({
        kind: 'exact',
        path: STATUS_ROUTE,
        handler: (_req, res) => {
          const fingerprint = statusFingerprint()
          json(res, 200, { ...fingerprint, successor: successorPending(resolveProfileDir(config)), uptime: Math.round(process.uptime()) })
        },
      })

      const stopRestart = webServer.register({
        kind: 'exact',
        path: RESTART_ROUTE,
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            json(res, 405, { error: 'method not allowed' })
            return
          }
          if (!requestAllowed(req)) {
            json(res, 403, { error: 'forbidden' })
            return
          }
          // Reply FIRST: under systemd the restart kills this process the
          // moment systemctl runs — the response must already be on the wire.
          json(res, 200, { ok: true })
          try {
            triggerRestart(resolveProfileDir(config))
          } catch (error) {
            logEvent('error', 'restart', String(error instanceof Error ? error.message : error))
          }
        },
      })

      const stopDiagnostics = webServer.register({
        kind: 'exact',
        path: DIAGNOSTICS_ROUTE,
        handler: (_req, res) => {
          const profileDir = resolveProfileDir(config)
          const items = readInstalled(profileDir)
          const patchIds = new Map<string, number>()
          try {
            const text = readFileSync(join(profileDir, 'cordis.patch.yml'), 'utf8')
            for (const line of text.split(/\r?\n/)) {
              const m = /^\s*-\s*id:\s*['"]?([A-Za-z0-9._/@-]+)/.exec(line)
              if (m !== null) patchIds.set(m[1], (patchIds.get(m[1]) ?? 0) + 1)
            }
          } catch { /* no patch file */ }
          const duplicates = [...patchIds.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }))
          const missingOnDisk = items.filter((item) => item.version === null).map((item) => item.name)
          const linkSources = items.filter((item) => item.source === 'link' || item.source === 'file').map((item) => item.name)
          const userManaged = [...readUserPatchControls(profileDir).ids]
          const disabledRows = userManaged.filter((id) => {
            try {
              const text = readFileSync(join(profileDir, 'cordis.patch.yml'), 'utf8')
              return new RegExp(`-\\s*id:\\s*['"]?${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\s*$[\\s\S]*?disabled:\s*true`).test(text)
            } catch {
              return false
            }
          })
          json(res, 200, {
            dsh: dshHostInfo(),
            pluginCount: items.length,
            duplicates,
            missingOnDisk,
            linkSources,
            disabledRows,
            hot: listHotMounts(),
          })
        },
      })

      return () => {
        stopHost()
        stopConfig()
        stopInstall()
        stopSettings()
        stopFavorite()
        stopNote()
        stopTheme()
        stopLogs()
        stopInstalled()
        stopUninstall()
        stopUpdate()
        stopApproveBuilds()
        stopHealth()
        stopSetupPnpm()
        stopToggle()
        stopGroup()
        stopOrder()
        stopSnapshots()
        stopRestoreSnapshot()
        stopStatus()
        stopRestart()
        stopDiagnostics()
      }
    }, 'dsh-plugins-mp: host routes')
  })
}
