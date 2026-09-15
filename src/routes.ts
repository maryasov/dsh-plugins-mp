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
 */
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { CONFIG_ROUTE, fetchDetail, installSourceFor, resolveApiBase, type MpApiConfig } from './api.js'
import { dshHostInfo } from './host-info.js'

export const HOST_ROUTE = '/plugins/dsh-plugins-mp/host'
export const INSTALL_ROUTE = '/plugins/dsh-plugins-mp/install'

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

export function runDshPluginAdd(
  profile: string,
  source: string,
  timeoutMs = INSTALL_TIMEOUT_MS,
): Promise<InstallOutcome> {
  const command = `dsh plugin --profile ${profile} add ${source}`
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
      const child = spawn(cmd.argv[0], [...cmd.argv.slice(1), 'plugin', '--profile', profile, 'add', source], {
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
        resolve({ ok: code === 0 && !timedOut, code, command, source, output: output.trim(), timedOut })
      })
    }
    attempt(0)
  })
}

export function mountRoutes(ctx: {
  inject: (deps: string[], fn: (sctx: never) => unknown) => unknown
}, config: MpApiConfig = {}): void {
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
          if (installing) {
            json(res, 409, { error: 'another install is already in progress' })
            return
          }
          installing = true
          try {
            const outcome = await runDshPluginAdd(profile, resolved.source)
            json(res, 200, outcome)
          } finally {
            installing = false
          }
        },
      })

      return () => {
        stopHost()
        stopConfig()
        stopInstall()
      }
    }, 'dsh-plugins-mp: host routes')
  })
}
