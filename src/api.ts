/**
 * Marketplace API client (host half). Minimal local mirror of the
 * dsh-plugins.vue-z.com response DTOs — the shared types live in the private
 * site repo, the plugin must build standalone.
 */

export const DEFAULT_API_BASE = 'https://dsh-plugins.vue-z.com/api'

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

export function resolveApiBase(config?: MpApiConfig): string {
  const base = config?.apiBase ?? process.env.DSH_MP_API_URL ?? DEFAULT_API_BASE
  return base.replace(/\/+$/, '')
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
    category?: string
    profile?: string
    installable?: boolean
    sort?: string
    limit?: number
    page?: number
  },
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  const usp = new URLSearchParams()
  if (query.q) usp.set('q', query.q)
  if (query.category) usp.set('category', query.category)
  if (query.profile) usp.set('profile', query.profile)
  if (query.installable) usp.set('installable', '1')
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
