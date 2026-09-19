/**
 * Marketplace API client (host half). Minimal local mirror of the
 * dsh-plugins-mp.com response DTOs — the shared types live in the private
 * site repo, the plugin must build standalone.
 */

import { readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_API_BASE = 'https://dsh-plugins-mp.com/api'

export interface MpCard {
  slug: string
  displayName: string
  authorName: string | null
  shortDescription: string | null
  sourceType: 'npm' | 'github' | 'tarball' | 'manual'
  npmPackage: string | null
  repoOwner: string | null
  repoName: string | null
  license: string | null
  primaryLanguage: string | null
  verificationState: string
  isOfficial: boolean
  profiles: string[]
  status: string
  stars: number
  forks: number
  npmDownloadsWeek: number
  tags: string[]
  categories: string[]
  /** Catalog section: plugin | skill | app (absent on old API versions). */
  section?: 'plugin' | 'skill' | 'app'
  sourceUpdatedAt: string | null
  latestVersion: string | null
}

export interface MpTranslation {
  locale: string
  kind: string
  textMd: string
  isMachine: boolean
}

export interface MpTestRun {
  dshRelease: string
  releaseIndex: number
  profile: string
  status: 'passed' | 'failed' | 'timeout' | 'error'
  finishedAt: string | null
}

export interface MpVersion {
  version: string
  npmVersion: string | null
  sizeBytes: number | null
  publishedAt: string | null
  testRuns?: MpTestRun[]
}

export interface MpDetail {
  plugin: MpCard & {
    descriptionMd: string
    originalLang: string
    homepageUrl: string | null
    uiLanguages: string[]
    capabilities: Record<string, boolean>
    deprecatedReason: string | null
    translations: MpTranslation[]
  }
  versions: MpVersion[]
  related: MpCard[]
  similar: MpCard[]
}

export interface CatalogResponse {
  items: MpCard[]
  total: number
  page: number
  limit: number
}

export interface MpApiConfig {
  apiBase?: string
}

export const CONFIG_ROUTE = '/plugins/dsh-plugins-mp/config'

/**
 * Parse a `.env`-style file (KEY=value, ignoring blanks, # comments and
 * surrounding quotes). Used to let the plugin pick up a local backend override
 * without shipping one — no `.env` in the plugin folder means we fall back to
 * the hosting backend (DEFAULT_API_BASE).
 */
export function parseDotEnv(contents: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key) out[key] = val
  }
  return out
}

/**
 * Absolute path to the plugin's own folder, where a local `.env` may live.
 * `process.env.DMP_PLUGIN_DIR` lets callers (and tests) point at a specific
 * folder; otherwise we resolve it from this bundled module's own location via
 * `import.meta.url` — works whether the plugin is installed from a local path
 * or a git clone.
 */
export function pluginDir(): string {
  if (process.env.DMP_PLUGIN_DIR) return process.env.DMP_PLUGIN_DIR
  const here = dirname(fileURLToPath(import.meta.url))
  try {
    return dirname(realpathSync(here))
  } catch {
    return join(here, '..')
  }
}

/** Value of a backend override from a local `.env`, or undefined if absent. */
export function localDotEnvApiBase(): string | undefined {
  try {
    const contents = readFileSync(join(pluginDir(), '.env'), 'utf8')
    return parseDotEnv(contents)['DSH_MP_API_URL']
  } catch {
    return undefined
  }
}

/**
 * Normalize a backend base for the `/api`-prefixed client. Strips trailing
 * slashes and, for absolute URLs that omit the `/api` segment, appends it — so
 * `DSH_MP_API_URL=https://dev.dsh-plugins-mp.com` and
 * `.../api` both resolve correctly. The `/api` path is required because the API
 * server is reached via `dev.dsh-plugins-mp.com/api` (nginx strips it → :4000).
 */
export function normalizeApiBase(base: string): string {
  let b = base.replace(/\/+$/, '')
  if (/^https?:\/\//i.test(b) && !/\/api\b/.test(b)) b += '/api'
  return b
}

export function resolveApiBase(config?: MpApiConfig): string {
  const base =
    config?.apiBase ?? process.env.DSH_MP_API_URL ?? localDotEnvApiBase() ?? DEFAULT_API_BASE
  return normalizeApiBase(base)
}

async function api<T>(base: string, path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { accept: 'application/json' },
    signal,
  })
  if (!res.ok) {
    throw new Error(`marketplace API ${path} -> ${res.status}`)
  }
  return (await res.json()) as T
}

export function fetchCatalog(
  base: string,
  query: {
    q?: string
    section?: string
    category?: string
    profile?: string
    installable?: boolean
    slugs?: string[]
    sort?: string
    limit?: number
    page?: number
  },
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  const usp = new URLSearchParams()
  if (query.q) usp.set('q', query.q)
  if (query.section) usp.set('section', query.section)
  if (query.category) usp.set('category', query.category)
  if (query.profile) usp.set('profile', query.profile)
  if (query.installable) usp.set('installable', '1')
  if (query.slugs !== undefined && query.slugs.length > 0) usp.set('slugs', query.slugs.join(','))
  if (query.sort) usp.set('sort', query.sort)
  usp.set('limit', String(Math.min(query.limit ?? 12, 25)))
  usp.set('page', String(query.page ?? 1))
  return api(base, `/plugins?${usp.toString()}`, signal)
}

export function fetchDetail(base: string, slug: string, signal?: AbortSignal): Promise<MpDetail> {
  return api(base, `/plugins/${encodeURIComponent(slug)}`, signal)
}

export function fetchSimilar(
  base: string,
  slug: string,
  signal?: AbortSignal,
): Promise<{ items: MpCard[] }> {
  return api(base, `/plugins/${encodeURIComponent(slug)}/similar`, signal)
}

/**
 * Install source for `dsh plugin --profile <p> add <source>`: npm package when
 * known, otherwise the GitHub repo (pnpm understands `github:` shorthand).
 */
export function installSourceFor(card: Pick<MpCard, 'slug' | 'npmPackage' | 'repoOwner' | 'repoName'>): string {
  if (card.npmPackage) return card.npmPackage
  if (card.repoOwner && card.repoName) return `github:${card.repoOwner}/${card.repoName}`
  return card.slug
}

export function installCommandFor(
  card: Pick<MpCard, 'slug' | 'npmPackage' | 'repoOwner' | 'repoName'>,
  profile = 'web',
): string {
  return `dsh plugin --profile ${profile} add ${installSourceFor(card)}`
}
