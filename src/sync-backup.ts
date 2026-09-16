/**
 * Remote backup targets (plan #12): WebDAV and a private GitHub Gist.
 *
 * Security posture (ported from dsh-market, MIT — backup.ts + gist.ts):
 * - Credentials are NEVER persisted by the plugin: WebDAV url/username/
 *   password and the Gist token arrive per request from the client; a Gist
 *   token may also come from the DSH_MP_GITHUB_TOKEN / GITHUB_TOKEN env of
 *   the host process (which enables the daily auto-backup) or from the gh
 *   CLI auth on disk.
 * - WebDAV: https-only, no credentials in the URL, private/link-local
 *   targets refused, DNS resolved once and the socket pinned to the checked
 *   address (closes the rebinding window).
 * - Gist: the API host is hard-coded to api.github.com (no SSRF surface),
 *   the gist id is allowlisted before it reaches a path, gists are private,
 *   and downloads go through validatedBackup before anything is returned.
 */
import { request as httpsRequest } from 'node:https'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { connect as netConnect } from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Duplex } from 'node:stream'
import { validatedBackup, type ProfileBackup } from './backup.js'

/**
 * Outbound proxy support (HTTPS_PROXY / https_proxy / ALL_PROXY / all_proxy):
 * on hosts whose direct path breaks large upstream TLS flows (VPN/DPI), the
 * machine-standard proxy is the only reliable route to GitHub. CONNECT
 * tunneling by hand — no undici dependency, works for both transports below.
 */
function proxyUrl(): URL | null {
  for (const name of ['HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy']) {
    const value = process.env[name]
    if (typeof value === 'string' && value.trim() !== '') {
      try {
        const parsed = new URL(value.trim())
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed
      } catch { /* ignore malformed */ }
    }
  }
  return null
}

function tunnelThroughProxy(proxy: URL, host: string, port: number): Promise<Duplex> {
  return new Promise<Duplex>((resolveTunnel, rejectTunnel) => {
    const socket = netConnect(Number(proxy.port === '' ? 80 : proxy.port), proxy.hostname, () => {
      socket.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\nProxy-Connection: keep-alive\r\n\r\n`)
    })
    socket.once('error', rejectTunnel)
    let head = ''
    const onData = (chunk: Buffer | string): void => {
      head += chunk.toString('utf8')
      if (!head.includes('\r\n\r\n')) return
      socket.off('data', onData)
      const status = Number.parseInt(/^HTTP\/1\.[01]\s+(\d{3})/.exec(head)?.[1] ?? '0', 10)
      if (status !== 200) {
        socket.destroy()
        rejectTunnel(new Error(`proxy CONNECT failed: HTTP ${status}`))
        return
      }
      resolveTunnel(socket)
    }
    socket.on('data', onData)
  })
}

/**
 * Open a raw socket to host:port — through the configured proxy when present
 * (CONNECT), direct otherwise. The caller upgrades TLS with SNI = host.
 */
async function openSocket(host: string, port: number): Promise<Duplex> {
  const proxy = proxyUrl()
  if (proxy === null) return netConnect(port, host)
  return tunnelThroughProxy(proxy, host, port)
}

// --------------------------------------------------------------------- WebDAV

const WEBDAV_TIMEOUT_MS = 30_000

interface WebdavResponse {
  status: number
  body: Buffer
  location?: string
}

async function webdavRequest(
  url: string,
  username: string,
  password: string,
  method: 'GET' | 'PUT' | 'MKCOL',
  body?: string,
): Promise<WebdavResponse> {
  const parsed = new URL(url)
  if (parsed.protocol === 'http:') throw new Error('WebDAV requires an https:// URL')
  if (parsed.protocol !== 'https:') throw new Error('invalid WebDAV URL')
  if (parsed.username !== '' || parsed.password !== '') throw new Error('invalid WebDAV URL')
  const address = await resolvePublicAddress(parsed.hostname)
  const headers: Record<string, string> = { host: parsed.host }
  if (body !== undefined) {
    headers['content-type'] = 'application/json'
    headers['content-length'] = String(Buffer.byteLength(body))
  }
  if (username !== '') headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  const originalHostname = unbracketedHostname(parsed.hostname)
  return await new Promise<WebdavResponse>((resolveRequest, rejectTunnel) => {
    void (async () => {
      // The socket may be a proxy CONNECT tunnel — pinned to the checked IP.
      const socket = await openSocket(address.address, Number(parsed.port === '' ? 443 : Number(parsed.port)))
      const request = httpsRequest({
        protocol: 'https:',
        hostname: address.address,
        family: address.family,
        port: parsed.port === '' ? 443 : Number(parsed.port),
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers,
        socket,
        servername: isIP(originalHostname) === 0 ? originalHostname : undefined,
        signal: AbortSignal.timeout(WEBDAV_TIMEOUT_MS),
      }, (response) => {
        const chunks: Buffer[] = []
        let size = 0
        const maxBytes = method === 'GET' ? 2 * 1024 * 1024 : 64 * 1024
        response.once('error', rejectTunnel)
        const declared = Number(response.headers['content-length'])
        if (Number.isFinite(declared) && declared > maxBytes) {
          response.destroy(new Error('WebDAV response is too large'))
          return
        }
        response.on('data', (chunk: Buffer | string) => {
          const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          size += value.byteLength
          if (size > maxBytes) {
            response.destroy(new Error('WebDAV response is too large'))
            return
          }
          chunks.push(value)
        })
        response.once('end', () => resolveRequest({
          status: response.statusCode ?? 0,
          body: Buffer.concat(chunks),
          ...(typeof response.headers.location === 'string' ? { location: response.headers.location } : {}),
        }))
      })
      request.once('error', rejectTunnel)
      request.end(body)
    })().catch(rejectTunnel)
  })
}

/** Ancestor collection URLs of a WebDAV file, outermost first (server root excluded). */
export function webdavParentCollections(url: string): string[] {
  let parsed: URL
  try { parsed = new URL(url) } catch { return [] }
  const parts = parsed.pathname.split('/').filter((part) => part !== '')
  parts.pop()
  const collections: string[] = []
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    collections.push(`${parsed.origin}${path}/`)
  }
  return collections
}

/** Upload the backup, creating missing parent collections first (MKCOL 405 = exists). */
export async function uploadWebdav(url: string, username: string, password: string, backup: ProfileBackup): Promise<void> {
  for (const collection of webdavParentCollections(url)) {
    try {
      await webdavRequest(collection, username, password, 'MKCOL')
    } catch { /* the PUT below reports the real problem */ }
  }
  const response = await webdavRequest(url, username, password, 'PUT', JSON.stringify(backup))
  if (response.status < 200 || response.status >= 300) {
    throw new Error(response.status === 404
      ? 'WebDAV upload failed: HTTP 404 — the target folder does not exist and could not be created (use a path inside a folder, e.g. https://dav.example.com/dsh/backup.json)'
      : `WebDAV upload failed: HTTP ${response.status}`)
  }
}

/** Only global-unicast IPv4 is a usable WebDAV target. */
export function isPublicIpv4(ip: string): boolean {
  const octets = ip.split('.').map(Number)
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [a, b] = octets as [number, number, number, number]
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && (b === 0 || b === 168)) return false
  if (a === 198 && (b === 18 || b === 19)) return false
  return true
}

/** Only global-unicast IPv6 (2000::/3). */
export function isPublicIpv6(ip: string): boolean {
  const bare = unbracketedHostname(ip)
  if (isIP(bare) !== 6) return false
  const first = Number.parseInt(bare.split(':', 1)[0] || '0', 16)
  return Number.isFinite(first) && first >= 0x2000 && first <= 0x3fff
}

function isPublicHostname(hostname: string): boolean {
  const bare = unbracketedHostname(hostname).toLowerCase()
  const noDot = bare.endsWith('.') ? bare.slice(0, -1) : bare
  return noDot !== '' && noDot !== 'localhost' && noDot !== 'metadata.google.internal'
    && !noDot.endsWith('.localhost') && !noDot.endsWith('.internal') && !noDot.endsWith('.local')
}

export function isPublicTarget(hostname: string): boolean {
  const bare = unbracketedHostname(hostname)
  const family = isIP(bare)
  if (family === 4) return isPublicIpv4(bare)
  if (family === 6) return isPublicIpv6(bare)
  return isPublicHostname(bare)
}

function unbracketedHostname(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
}

/** Resolve once, reject unsafe answers, return the address to pin the socket to. */
async function resolvePublicAddress(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
  const bare = unbracketedHostname(hostname)
  const family = isIP(bare)
  if (family === 4 || family === 6) {
    if (!isPublicTarget(bare)) throw new Error('invalid WebDAV URL')
    return { address: bare, family }
  }
  if (!isPublicHostname(bare)) throw new Error('invalid WebDAV URL')
  const addresses = await lookup(bare, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicTarget(address))) {
    throw new Error('invalid WebDAV URL')
  }
  const selected = addresses[0]
  if (selected === undefined || (selected.family !== 4 && selected.family !== 6)) throw new Error('invalid WebDAV URL')
  return { address: selected.address, family: selected.family }
}

const MAX_REDIRECTS = 5

export async function downloadWebdav(url: string, username: string, password: string): Promise<ProfileBackup> {
  // GET follows redirects (providers answer with signed CDN links); PUT is
  // direct everywhere seen. Auth never crosses origins: a redirect target is
  // the server's choice, not the user's.
  let currentUrl = url
  let response = await webdavRequest(currentUrl, username, password, 'GET')
  for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
    if (response.status !== 301 && response.status !== 302 && response.status !== 303
      && response.status !== 307 && response.status !== 308) break
    if (response.location === undefined) break
    const next = new URL(response.location, currentUrl)
    const sameOrigin = next.origin === new URL(currentUrl).origin
    currentUrl = next.toString()
    response = sameOrigin
      ? await webdavRequest(currentUrl, username, password, 'GET')
      : await webdavRequest(currentUrl, '', '', 'GET')
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`WebDAV download failed: HTTP ${response.status}`)
  }
  return validatedBackup(JSON.parse(response.body.toString('utf8')) as unknown)
}

// ----------------------------------------------------------------------- Gist

const GIST_API = 'https://api.github.com'
const GIST_FILENAME = 'dsh-mp-backup.json'
const GIST_MAX_BYTES = 1024 * 1024
const GIST_ID_RE = /^[A-Za-z0-9_-]{1,64}$/

/** Where the Gist token came from — surfaced in the UI. */
export type TokenSource = 'request' | 'env' | 'gh' | 'none'

export function resolveGistToken(token: unknown): { token: string; source: TokenSource } {
  if (typeof token === 'string' && token.trim() !== '') return { token: token.trim(), source: 'request' }
  for (const name of ['DSH_MP_GITHUB_TOKEN', 'GITHUB_TOKEN']) {
    const value = process.env[name]
    if (typeof value === 'string' && value.trim() !== '') return { token: value.trim(), source: 'env' }
  }
  // gh CLI auth on disk (never written by us).
  try {
    const hosts = JSON.parse(readFileSync(join(homedir(), '.config', 'gh', 'hosts.yml'), 'utf8')) as Record<string, { oauth_token?: string }>
    for (const entry of Object.values(hosts)) {
      if (typeof entry?.oauth_token === 'string' && entry.oauth_token !== '') return { token: entry.oauth_token, source: 'gh' }
    }
  } catch { /* gh not installed / not logged in */ }
  return { token: '', source: 'none' }
}

export function parseGistId(input: string): string {
  if (!GIST_ID_RE.test(input)) throw new Error('invalid gist id')
  return input
}

interface GistApiResult {
  ok: boolean
  status: number
  body: string
}

/**
 * Deliberately node:https, NOT global fetch: the dsh-web harness installs a
 * global undici dispatcher for its own fetch proxying, and POSTs to
 * api.github.com die with ECONNRESET through it. A direct https request
 * bypasses that dispatcher entirely (same reasoning as the WebDAV transport).
 */
async function gistApi(
  token: string,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  payload?: unknown,
): Promise<GistApiResult> {
  const body = payload === undefined ? undefined : JSON.stringify(payload)
  return await new Promise<GistApiResult>((resolveRequest, rejectRequest) => {
    void (async () => {
      const socket = await openSocket('api.github.com', 443)
      const request = httpsRequest({
        protocol: 'https:',
        hostname: 'api.github.com',
        port: 443,
        path,
        method,
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'user-agent': 'dsh-plugins-mp',
          ...(body !== undefined ? { 'content-length': String(Buffer.byteLength(body)) } : {}),
        },
        socket,
        servername: 'api.github.com',
        signal: AbortSignal.timeout(25_000),
      }, (response) => {
        const chunks: Buffer[] = []
        let size = 0
        response.once('error', rejectRequest)
        response.on('data', (chunk: Buffer | string) => {
          const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          size += value.byteLength
          if (size > 4 * 1024 * 1024) {
            response.destroy(new Error('GitHub response is too large'))
            return
          }
          chunks.push(value)
        })
        response.once('end', () => resolveRequest({
          ok: (response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 300,
          status: response.statusCode ?? 0,
          body: Buffer.concat(chunks).toString('utf8'),
        }))
      })
      request.once('error', rejectRequest)
      request.end(body)
    })().catch(rejectRequest)
  })
}

function gistHttpError(status: number, body = ''): Error {
  if (status === 401) return new Error('GitHub rejected the token (HTTP 401)')
  if (status === 404) return new Error('Gist not found (HTTP 404)')
  if (status === 403) {
    if (body.includes('not accessible')) {
      return new Error('the token has no Gists permission — for a fine-grained token enable the Gists repository permission')
    }
    return new Error('GitHub rate limit or forbidden (HTTP 403)')
  }
  return new Error(`GitHub request failed: HTTP ${status}`)
}

/** Create a PRIVATE gist with the backup inside. */
export async function createGist(token: string, backup: ProfileBackup): Promise<{ id: string; url: string }> {
  const content = JSON.stringify(backup, null, 2)
  if (Buffer.byteLength(content) > GIST_MAX_BYTES) throw new Error('backup exceeds the GitHub Gist 1 MB limit')
  const res = await gistApi(token, 'POST', '/gists', {
    description: `dsh-plugins-mp profile backup ${new Date().toISOString().slice(0, 10)}`,
    public: false,
    files: { [GIST_FILENAME]: { content } },
  })
  if (!res.ok) throw gistHttpError(res.status, res.body)
  const parsed = JSON.parse(res.body) as { id?: unknown; html_url?: unknown }
  if (typeof parsed.id !== 'string' || typeof parsed.html_url !== 'string') throw new Error('unexpected GitHub response')
  return { id: parsed.id, url: parsed.html_url }
}

/** Update an existing gist (same file name). */
export async function updateGist(token: string, gistId: string, backup: ProfileBackup): Promise<{ id: string; url: string }> {
  const content = JSON.stringify(backup, null, 2)
  if (Buffer.byteLength(content) > GIST_MAX_BYTES) throw new Error('backup exceeds the GitHub Gist 1 MB limit')
  const res = await gistApi(token, 'PATCH', `/gists/${gistId}`, {
    files: { [GIST_FILENAME]: { content } },
  })
  if (!res.ok) throw gistHttpError(res.status, res.body)
  const parsed = JSON.parse(res.body) as { id?: unknown; html_url?: unknown }
  if (typeof parsed.id !== 'string' || typeof parsed.html_url !== 'string') throw new Error('unexpected GitHub response')
  return { id: parsed.id, url: parsed.html_url }
}

/** Fetch a gist's backup file; strictly validated before it leaves this module. */
export async function readGist(token: string, gistId: string): Promise<ProfileBackup> {
  const res = await gistApi(token, 'GET', `/gists/${gistId}`)
  if (!res.ok) throw gistHttpError(res.status, res.body)
  const parsed = JSON.parse(res.body) as { files?: Record<string, { content?: string } | undefined> }
  const file = parsed.files?.[GIST_FILENAME]
  if (file === undefined || typeof file.content !== 'string') throw new Error('the gist has no dsh-mp-backup.json file')
  return validatedBackup(JSON.parse(file.content) as unknown)
}

/** Cheap token check (GET /user). */
export async function verifyGistToken(token: string): Promise<void> {
  const res = await gistApi(token, 'GET', '/user')
  if (!res.ok) throw gistHttpError(res.status, res.body)
}
