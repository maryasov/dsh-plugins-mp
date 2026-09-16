/**
 * Profile filesystem inspection for the "My plugins" surface: what the
 * profile actually has installed (package.json dependencies crossed with
 * node_modules manifests), where each package came from, and whether a
 * newer npm release exists. Pure reads plus one registry fetch — no
 * processes, no writes.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Template bundles DSH installs itself — never shown as community plugins. */
export const INBOX_BUNDLES = new Set([
  '@deepseek-ai/dsh-base',
  '@deepseek-ai/dsh-web-app',
  '@deepseek-ai/dsh-headless',
])

export type InstallSource = 'npm' | 'github' | 'git' | 'link' | 'file'

export function classifySource(spec: string): InstallSource {
  if (spec.startsWith('link:')) return 'link'
  if (spec.startsWith('file:')) return 'file'
  if (spec.startsWith('github:')) return 'github'
  if (/^(git\+|https?:\/\/.+\.git)/.test(spec) || /\.git(?:#|$)/.test(spec)) return 'git'
  return 'npm'
}

export interface InstalledItem {
  name: string
  /** The package.json dependency spec (^x.y.z, link:, github:owner/repo#tag, …). */
  spec: string
  source: InstallSource
  /** Installed version from the package manifest, when readable. */
  version: string | null
  description: string | null
  /** The package declares a DSH client bundle (dsh.client). */
  hasClient: boolean
}

/** Community dependencies of the profile (in-box bundles filtered out). */
export function readInstalled(profileDir: string): InstalledItem[] {
  const manifestPath = join(profileDir, 'package.json')
  if (!existsSync(manifestPath)) return []
  let deps: Record<string, string> = {}
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as { dependencies?: Record<string, string> }
    deps = parsed.dependencies ?? {}
  } catch {
    return []
  }
  const items: InstalledItem[] = []
  for (const [name, spec] of Object.entries(deps)) {
    if (INBOX_BUNDLES.has(name)) continue
    let version: string | null = null
    let description: string | null = null
    let hasClient = false
    try {
      const manifest = JSON.parse(readFileSync(join(profileDir, 'node_modules', ...name.split('/'), 'package.json'), 'utf8')) as {
        version?: unknown
        description?: unknown
        dsh?: { client?: unknown }
      }
      if (typeof manifest.version === 'string') version = manifest.version
      if (typeof manifest.description === 'string') description = manifest.description
      hasClient = manifest.dsh?.client !== undefined
    } catch {
      // A dependency-listed name without a materialized tree: still listed,
      // marked by the missing version (dsh-market's "not installed" shape).
    }
    items.push({ name, spec, source: classifySource(spec), version, description, hasClient })
  }
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

/** Whether one package is actually materialized in the profile tree. */
export function isPackageOnDisk(profileDir: string, name: string): boolean {
  return existsSync(join(profileDir, 'node_modules', ...name.split('/'), 'package.json'))
}

/** The installed version of one package, or null when absent. */
export function installedVersion(profileDir: string, name: string): string | null {
  try {
    const manifest = JSON.parse(readFileSync(join(profileDir, 'node_modules', ...name.split('/'), 'package.json'), 'utf8')) as { version?: unknown }
    return typeof manifest.version === 'string' ? manifest.version : null
  } catch {
    return null
  }
}

/** The dependency spec a profile currently pins one package under. */
export function installedSpec(profileDir: string, name: string): string | undefined {
  try {
    const parsed = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> }
    return parsed.dependencies?.[name]
  } catch {
    return undefined
  }
}

/**
 * Three-way version comparison, enough for update detection: split into
 * numeric dot-parts, compare component-wise, then let a prerelease lose to
 * a release of the same triple. Non-numeric parts compare as strings.
 * @returns negative when a < b, positive when a > b, 0 when equal.
 */
export function compareVersions(a: string, b: string): number {
  const split = (v: string): { parts: (number | string)[]; pre: string | null } => {
    const [core, pre = null] = v.split('-')
    const parts = core.split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p))
    return { parts, pre }
  }
  const left = split(a.replace(/^v/, ''))
  const right = split(b.replace(/^v/, ''))
  const len = Math.max(left.parts.length, right.parts.length)
  for (let i = 0; i < len; i++) {
    const l = left.parts[i]
    const r = right.parts[i]
    if (l === undefined) return -1
    if (r === undefined) return 1
    if (l === r) continue
    const ln = typeof l === 'number'
    const rn = typeof r === 'number'
    if (ln && rn) return (l as number) - (r as number)
    if (ln) return 1
    if (rn) return -1
    return String(l) < String(r) ? -1 : 1
  }
  if (left.pre === null && right.pre !== null) return 1
  if (left.pre !== null && right.pre === null) return -1
  if (left.pre === right.pre) return 0
  return (left.pre ?? '') < (right.pre ?? '') ? -1 : 1
}

const npmLatestCache = new Map<string, { at: number; version: string | null }>()
const NPM_TTL_MS = 10 * 60_000

/** The registry's latest version of one package, cached for 10 minutes. */
export async function npmLatestVersion(name: string, signal?: AbortSignal): Promise<string | null> {
  const cached = npmLatestCache.get(name)
  if (cached !== undefined && Date.now() - cached.at < NPM_TTL_MS) return cached.version
  let version: string | null = null
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name).replace(/^%40/, '@')}/latest`, {
      headers: { accept: 'application/json' },
      signal,
    })
    if (res.ok) {
      const body = (await res.json()) as { version?: unknown }
      if (typeof body.version === 'string') version = body.version
    }
  } catch {
    // Registry unreachable: report "unknown" rather than failing the list.
  }
  npmLatestCache.set(name, { at: Date.now(), version })
  return version
}

/**
 * Package names pnpm blocked during an install — the exact "Ignored build
 * scripts:" line its output prints (same parse as dsh-market's installer).
 */
export function parseIgnoredBuilds(output: string): string[] {
  const m = /Ignored build scripts?:?\s*([^\n]+)/i.exec(output)
  if (m === null) return []
  return m[1].split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
}
