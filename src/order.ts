/**
 * Community bundle ordering — parity plan #16 (dsh-market issue #98).
 * The user reorders the community bundles of the profile's layer stack;
 * official in-box bundles keep their exact positions and are never moved,
 * added, removed or duplicated by a reorder.
 *
 * Ported from dsh-market (MIT) src/order.ts — same manifest contract
 * (`dsh.profile.bundles` in the profile package.json, `dsh.bundle.order`
 * before/after rules in each bundle's own manifest). Adapted: single-language
 * errors, the dsh install anchor comes from dshHostInfo(), and the boot
 * trial itself is NOT here — the routes run the real `dsh --dump-config`
 * against the candidate and roll back on failure.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { dshHostInfo } from './host-info.js'

/** Profile bundles that ship with the dsh host and must stay put. */
export const INBOX_BUNDLES = new Set([
  '@deepseek-ai/dsh-base',
  '@deepseek-ai/dsh-web-app',
  '@deepseek-ai/dsh-headless',
])

/** The bundle stack as it appears in the profile manifest. */
export interface BundleStack {
  /** Full ordered list from dsh.profile.bundles. */
  bundles: string[]
  /** The subset that may be reordered (community bundles). */
  community: string[]
}

/** Author-declared ordering constraints of one bundle. */
export interface BundleRule {
  name: string
  /** This bundle must load after every name in this list. */
  after: string[]
  /** This bundle must load before every name in this list. */
  before: string[]
}

/** A violated before/after rule in a bundle order. */
export interface OrderConflict {
  name: string
  reason: string
}

/** Atomic same-directory replace: a crash mid-write can never truncate the manifest. */
export function writeFileAtomic(file: string, content: string): void {
  const temp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  writeFileSync(temp, content)
  renameSync(temp, file)
}

/** Read the profile's bundle stack (empty when the manifest is unreadable). */
export function readBundleStack(profileDir: string): BundleStack {
  try {
    const manifest = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as {
      dsh?: { profile?: { bundles?: unknown } }
    }
    const bundles = Array.isArray(manifest.dsh?.profile?.bundles)
      ? manifest.dsh.profile.bundles.filter((name): name is string => typeof name === 'string')
      : []
    return { bundles, community: bundles.filter((name) => !INBOX_BUNDLES.has(name)) }
  } catch {
    return { bundles: [], community: [] }
  }
}

/**
 * Resolve a bundle's package.json the way the boot does: the dsh installation
 * anchor first (in-box bundles live there, never in the profile), then Node's
 * module search from the profile directory (covers pnpm workspace-root
 * hoisting). Best-effort — unreadable bundles contribute no rules.
 */
function resolveBundlePackageJson(profileDir: string, name: string): string | null {
  const installDir = dshHostInfo()?.directory ?? null
  const anchors = [
    installDir !== null ? join(installDir, 'package.json') : null,
    join(profileDir, 'package.json'),
  ]
  for (const anchor of anchors) {
    if (anchor === null) continue
    let paths: string[] = []
    try {
      paths = createRequire(anchor).resolve.paths(name) ?? []
    } catch {
      continue
    }
    for (const searchPath of paths) {
      const candidate = join(searchPath, name)
      if (existsSync(join(candidate, 'package.json'))) return join(candidate, 'package.json')
    }
  }
  return null
}

/**
 * Each bundle's declared ordering rules (`dsh.bundle.order.{before,after}` —
 * lists of bundle package names). Unresolvable packages and missing
 * declarations contribute nothing.
 */
export function readBundleRules(profileDir: string): BundleRule[] {
  const { bundles } = readBundleStack(profileDir)
  const rules: BundleRule[] = []
  for (const name of bundles) {
    const packageJson = resolveBundlePackageJson(profileDir, name)
    if (packageJson === null) continue
    try {
      const manifest = JSON.parse(readFileSync(packageJson, 'utf8')) as {
        dsh?: { bundle?: { order?: unknown } }
      }
      const order = manifest.dsh?.bundle?.order
      if (order === null || typeof order !== 'object' || Array.isArray(order)) continue
      const listOf = (value: unknown): string[] =>
        Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
      const rule: BundleRule = {
        name,
        after: listOf((order as Record<string, unknown>).after),
        before: listOf((order as Record<string, unknown>).before),
      }
      if (rule.after.length > 0 || rule.before.length > 0) rules.push(rule)
    } catch { /* package unreadable — no rule */ }
  }
  return rules
}

/**
 * Check a bundle order against the declared before/after rules. Rules naming
 * bundles outside `order` are ignored (a rule for a not-yet-installed bundle
 * must not block the current stack). Returns every violated rule; [] when all hold.
 */
export function validateOrder(bundleNames: string[], rules: BundleRule[]): OrderConflict[] {
  const position = new Map(bundleNames.map((name, index) => [name, index]))
  const conflicts: OrderConflict[] = []
  for (const rule of rules) {
    const pos = position.get(rule.name)
    if (pos === undefined) continue
    for (const other of rule.after) {
      const otherPos = position.get(other)
      if (otherPos === undefined) continue
      if (otherPos >= pos) {
        conflicts.push({ name: rule.name, reason: `must load after ${other} (position ${otherPos} ≥ ${pos})` })
      }
    }
    for (const other of rule.before) {
      const otherPos = position.get(other)
      if (otherPos === undefined) continue
      if (otherPos <= pos) {
        conflicts.push({ name: rule.name, reason: `must load before ${other} (position ${otherPos} ≤ ${pos})` })
      }
    }
  }
  return conflicts
}

/**
 * Merge a community-bundle permutation into the full stack. In-box bundles
 * keep their EXACT positions; community slots are replaced by `newOrder` in
 * order of appearance. Pure — nothing is written. Rejects duplicates,
 * additions, omissions and official names.
 */
export function mergeOrder(bundles: string[], newOrder: string[]): { ok: true; bundles: string[] } | { ok: false; error: string } {
  const communitySet = new Set(bundles.filter((name) => !INBOX_BUNDLES.has(name)))
  if (new Set(newOrder).size !== newOrder.length) {
    return { ok: false, error: 'duplicate bundle names in the new order' }
  }
  if (newOrder.length !== communitySet.size) {
    return { ok: false, error: 'the new order must contain exactly the current community bundles' }
  }
  for (const name of newOrder) {
    if (!communitySet.has(name)) {
      return { ok: false, error: `${name} is not a reorderable community bundle` }
    }
  }
  const merged = [...bundles]
  let cursor = 0
  for (let index = 0; index < merged.length; index += 1) {
    const name = merged[index]
    if (name === undefined || INBOX_BUNDLES.has(name)) continue
    merged[index] = newOrder[cursor]
    cursor += 1
  }
  return { ok: true, bundles: merged }
}

/**
 * Apply a new community-bundle order to the profile manifest. On any failure
 * the manifest is left untouched. The caller owns the boot trial and rollback.
 */
export function applyBundleOrder(profileDir: string, newOrder: string[]): { ok: true; bundles: string[] } | { ok: false; error: string } {
  const { bundles } = readBundleStack(profileDir)
  const merged = mergeOrder(bundles, newOrder)
  if (!merged.ok) return merged
  try {
    const manifestPath = join(profileDir, 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      dsh?: { profile?: { bundles?: unknown } }
    }
    manifest.dsh ??= {}
    manifest.dsh.profile ??= {}
    manifest.dsh.profile.bundles = merged.bundles
    writeFileAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    return merged
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
