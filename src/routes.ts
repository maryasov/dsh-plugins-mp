/**
 * Host HTTP surface (web profiles only, mounted through the dynamic
 * ctx.inject(['webServer']) pattern — headless profiles skip it):
 *
 * - GET  /plugins/dsh-plugins-mp/host    → { dsh: { version } | null }
 * - POST /plugins/dsh-plugins-mp/install → body { slug, profile, dry? };
 *   resolves the install source from the marketplace API and re-invokes the
 *   `dsh plugin` CLI (child_process, NOT ctx.shell: the agent shell is a
 *   sandboxed executor that denies profile writes — same reasoning as
 *   dsh-market). One install at a time.
 */
import { spawn } from 'node:child_process'
import { fetchDetail, installSourceFor, resolveApiBase, type MpApiConfig } from './api.js'
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

export function runDshPluginAdd(
  profile: string,
  source: string,
  timeoutMs = INSTALL_TIMEOUT_MS,
): Promise<InstallOutcome> {
  const command = `dsh plugin --profile ${profile} add ${source}`
  return new Promise((resolve) => {
    let output = ''
    let timedOut = false
    const collect = (buf: Buffer): void => {
      output += buf.toString('utf8')
      if (output.length > MAX_OUTPUT_CHARS) output = output.slice(-MAX_OUTPUT_CHARS)
    }
    let child: ReturnType<typeof spawn>
    try {
      child = spawn('dsh', ['plugin', '--profile', profile, 'add', source], {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      resolve({ ok: false, code: null, command, source, output: String(error), timedOut: false })
      return
    }
    child.stdout?.on('data', collect)
    child.stderr?.on('data', collect)
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timer)
      resolve({ ok: false, code: null, command, source, output: `${output}\n${String(error)}`.trim(), timedOut })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ ok: code === 0 && !timedOut, code, command, source, output: output.trim(), timedOut })
    })
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
        stopInstall()
      }
    }, 'dsh-plugins-mp: host routes')
  })
}
