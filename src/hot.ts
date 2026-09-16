/**
 * Restart-free installs and live toggles, adapted from dsh-market's hot.ts
 * (MIT, © dsh-market contributors) and proven against DSH 0.1.6-alpha.1.
 *
 * A freshly installed plugin is mounted into the RUNNING composition through
 * a plugin-owned Include subtree: the durable state stays with the profile's
 * `dsh.profile.bundles` (reconciled by the dsh CLI at install time), so the
 * next boot loads it through the normal bundle layer. The subtree exists only
 * for the current process; its input files under `<profile>/.dsh-mp/` are
 * wiped on every boot, so a crash can never leave a file that collides with
 * the bundle layer. `state.json` in the same directory deliberately survives.
 *
 * 0.1.6 note: the vendored `@deepseek-ai/cordis-plugin-include` is NOT in the
 * profile module fallback for link:-mounted plugins, so the class resolves
 * through three candidates (bare import → harness-materialized link under
 * DSH_HOME/profiles/node_modules → the running dev-checkout's vendor tree).
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { logEvent } from './log.js'

export interface HotRow {
  id: string
  name: string
}

export interface PluginHandle {
  await(): Promise<unknown>
  dispose(): Promise<unknown> | void
}

/** The cordis surface hotMount needs (soft — may be absent on odd hosts). */
export interface HotContext {
  plugin(plugin: unknown, config: unknown): PluginHandle
  logger?: { info?(message: string): void; warn?(message: string): void }
}

let hotTreeClass: (new (...args: never[]) => { write(): void; import(name: string, getOuterStack?: () => string[]): unknown }) | null | undefined

async function importIncludeModule(): Promise<{ Include?: unknown } | null> {
  // 1. Bare specifier — resolves wherever the profile fallback (or a parent
  //    node_modules chain) exposes the harness-vendored package.
  try {
    const specifier = '@deepseek-ai/cordis-plugin-include'
    return (await import(/* @vite-ignore */ specifier)) as { Include?: unknown }
  } catch { /* fall through */ }
  // 2. The harness materializes profile-owned links under
  //    <DSH_HOME>/profiles/node_modules — reachable regardless of where THIS
  //    plugin's own package lives.
  try {
    const home = process.env.DSH_HOME !== undefined && process.env.DSH_HOME.trim() !== ''
      ? process.env.DSH_HOME
      : join(process.env.HOME ?? '', '.dsh')
    const candidate = join(home, 'profiles', 'node_modules', '@deepseek-ai', 'cordis-plugin-include', 'lib', 'index.js')
    if (existsSync(candidate)) {
      return (await import(pathToFileURL(candidate).href)) as { Include?: unknown }
    }
  } catch { /* fall through */ }
  // 3. Dev checkout: the running CLI entry points at <checkout>/apps/cli/…;
  //    walk up to the checkout root and use the built vendor tree.
  const entry = process.argv[1] ?? ''
  if (entry.includes(`${'apps'}${join('', '')}cli`)) {
    let dir = join(entry, '..')
    for (let i = 0; i < 6; i++) {
      const candidate = join(dir, 'vendor', 'include', 'lib', 'index.js')
      if (existsSync(candidate)) {
        return (await import(pathToFileURL(candidate).href)) as { Include?: unknown }
      }
      dir = join(dir, '..')
    }
  }
  return null
}

async function loadHotTreeClass(): Promise<typeof hotTreeClass> {
  if (hotTreeClass !== undefined) return hotTreeClass
  try {
    const mod = await importIncludeModule()
    const Include = mod?.Include
    if (typeof Include !== 'function') throw new Error('no Include export')
    class MpHotTree extends (Include as new (...args: never[]) => { write(): void; import(name: string, getOuterStack?: () => string[]): unknown }) {
      /** Runtime-only mount list; the bundle layer owns persistence. */
      override write(): void {}
    }
    hotTreeClass = MpHotTree
  } catch (error) {
    logEvent('warn', 'hot', `include plugin unavailable: ${error instanceof Error ? error.message : String(error)}`)
    hotTreeClass = null
  }
  return hotTreeClass
}

/**
 * Profile-scoped resolution for hot-mount rows: turn a bare package name
 * into the absolute `file://` entry URL of the package installed into
 * `profileDir`. Include rows reach the loader as bare names, and the loader's
 * own parent-walk can never reach `profiles/<name>/node_modules` — handing
 * it a file:// URL is anchor-independent.
 */
export function resolveProfileEntry(profileDir: string, name: string): string {
  if (!name || name.startsWith('.') || name.startsWith('cordis:') || name.startsWith('file://')) return name
  const packageDir = join(profileDir, 'node_modules', ...name.split('/'))
  try {
    return pathToFileURL(createRequire(join(profileDir, 'package.json')).resolve(name)).href
  } catch {
    // No resolvable package entry: fall back to a checkable index.js
    // artifact, else keep the bare name and let the loader error accurately.
    for (const artifact of ['index.js', 'lib/index.js', 'dist/index.js']) {
      if (existsSync(join(packageDir, artifact))) return pathToFileURL(join(packageDir, artifact)).href
    }
    return name
  }
}

/**
 * Insert rows of a plugin's bundle patch, or null when the patch contains
 * anything beyond plain `id`/`name` insert rows (config blocks, disables,
 * expressions) — those compositions fall back to restart activation.
 * (Port of dsh-market's parseSimplePatch, CRLF-safe.)
 */
export function parseSimplePatch(patchText: string): HotRow[] | null {
  const rows: HotRow[] = []
  let pending: string | null = null
  for (const raw of patchText.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trimEnd()
    if (line.trim() === '') continue
    if (/^-\s+insert:\s*$/.test(line)) continue
    const id = /^\s+-\s+id:\s*(\S+)\s*$/.exec(line)
    if (id !== null) {
      if (pending !== null) return null
      pending = id[1]
      continue
    }
    const name = /^\s+name:\s*['"]?([^'"\s]+)['"]?\s*$/.exec(line)
    if (name !== null && pending !== null) {
      rows.push({ id: pending, name: name[1] })
      pending = null
      continue
    }
    return null
  }
  if (pending !== null || rows.length === 0) return null
  return rows
}

/** The `dsh` declaration block of an installed package, or null. */
function readPkgDsh(profileDir: string, packageName: string): { client?: unknown; bundle?: unknown } | null {
  try {
    const manifest = JSON.parse(
      readFileSync(join(profileDir, 'node_modules', ...packageName.split('/'), 'package.json'), 'utf8'),
    ) as { dsh?: { client?: unknown; bundle?: unknown } }
    return manifest.dsh ?? {}
  } catch {
    return null
  }
}

const HOT_DIR = '.dsh-mp'
const HOT_MOUNT_TIMEOUT_MS = Number(process.env.DSH_MP_HOT_MOUNT_TIMEOUT_MS) || 10_000

/** Wipe leftover hot-mount inputs; call once when the host routes start. */
export function cleanHotDir(profileDir: string): void {
  const dir = join(profileDir, HOT_DIR)
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (/^hot-\d+\.yml$/.test(name)) rmSync(join(dir, name), { force: true })
  }
}

let hotSequence = 0
const hotHandles = new Map<string, PluginHandle>()
const shimNames = new Set<string>()

/** Package names currently live through one of our hot mounts. */
export function listHotMounts(): string[] {
  return [...hotHandles.keys()]
}

class ActivationTimeout extends Error {}

function raceActivationTimeout<T>(awaitable: T | Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ActivationTimeout(`activation did not settle within ${HOT_MOUNT_TIMEOUT_MS / 1000}s — the plugin may be waiting on a service that never arrives`))
    }, HOT_MOUNT_TIMEOUT_MS)
    Promise.resolve(awaitable).then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })
}

export interface HotMountResult {
  ok: boolean
  reason: string | null
}

/** Dispose a package hot-mounted earlier in this session. */
export async function hotUnmount(packageName: string): Promise<boolean> {
  const handle = hotHandles.get(packageName)
  if (handle === undefined) return false
  hotHandles.delete(packageName)
  shimNames.delete(packageName)
  try {
    await handle.dispose()
    logEvent('info', 'hot-unmount', `${packageName}: removed live`)
    return true
  } catch (error) {
    logEvent('warn', 'hot-unmount', `${packageName}: dispose failed — ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * Mount `packageName` (just installed into the profile) into the running
 * composition. Returns whether the plugin is live without a restart, plus
 * the reason when it is not.
 */
export async function hotMount(ctx: HotContext, profileDir: string, packageName: string): Promise<HotMountResult> {
  try {
    const HotTree = await loadHotTreeClass()
    if (HotTree === null) {
      return { ok: false, reason: 'the host cannot hot-mount (include plugin unavailable); restart required' }
    }
    let patchText: string | null = null
    try {
      patchText = readFileSync(join(profileDir, 'node_modules', ...packageName.split('/'), 'cordis.patch.yml'), 'utf8')
    } catch {
      patchText = null
    }
    let rows: HotRow[]
    if (patchText !== null) {
      const parsed = parseSimplePatch(patchText)
      if (parsed === null) {
        return {
          ok: false,
          reason: 'the bundle patch contains config/expression rows; hot-mount only supports plain inserts — it activates on restart',
        }
      }
      rows = parsed
    } else {
      // No host patch: client-only packages (dsh.client, no dsh.bundle) get
      // a no-op shim entry so client-modules serves their bundle.
      const dsh = readPkgDsh(profileDir, packageName)
      if (dsh === null || dsh.client === undefined || dsh.bundle !== undefined) {
        return { ok: false, reason: 'no bundle patch and no dsh.client surface — nothing to hot-mount' }
      }
      shimNames.add(packageName)
      rows = [{ id: `client-${packageName.replace(/[^A-Za-z0-9_.-]/g, '-')}`, name: packageName }]
    }
    const dir = join(profileDir, HOT_DIR)
    mkdirSync(dir, { recursive: true, mode: 0o700 })
    hotSequence += 1
    const file = join(dir, `hot-${String(hotSequence)}.yml`)
    const yml = rows
      .map((row) => `- id: 'mp-${row.id}'\n  name: '${resolveProfileEntry(profileDir, row.name)}'\n`)
      .join('')
    writeFileSync(file, yml)
    const handle = ctx.plugin(HotTree, { path: pathToFileURL(file).href })
    try {
      await raceActivationTimeout(handle.await())
    } catch (error) {
      // A failed or wedged mount must leave NOTHING behind.
      try { Promise.resolve(handle.dispose()).catch(() => {}) } catch { /* best effort */ }
      try { rmSync(file, { force: true }) } catch { /* best effort */ }
      throw error
    }
    hotHandles.set(packageName, handle)
    ctx.logger?.info?.(`[dsh-plugins-mp] hot-mounted ${packageName}`)
    logEvent('info', 'hot-mount', `${packageName}: live${shimNames.has(packageName) ? ' (client-only shim)' : ''}`)
    return { ok: true, reason: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logEvent('warn', 'hot-mount', `${packageName}: fell back to restart — ${message}`)
    return { ok: false, reason: `hot-mount failed — restart required: ${message}` }
  }
}

/**
 * Row ids and package names the USER's own patch layer (cordis.patch.yml)
 * already manages. Line-wise scan on purpose: the file may hold structures
 * beyond plain rows, but any mention of a row id or package name is enough.
 */
export function readUserPatchControls(profileDir: string): { ids: Set<string>; names: Set<string> } {
  const ids = new Set<string>()
  const names = new Set<string>()
  try {
    const text = readFileSync(join(profileDir, 'cordis.patch.yml'), 'utf8')
    // Skip OUR managed disable blocks: a row we wrote must never count as
    // "the user patch manages this id" — otherwise enable, which reads the
    // file BEFORE its own block is removed, skips the live re-mount.
    let inManagedBlock = false
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed.startsWith('# >>> dsh-mp disable ')) { inManagedBlock = true; continue }
      if (trimmed.startsWith('# <<< dsh-mp disable ')) { inManagedBlock = false; continue }
      if (inManagedBlock) continue
      const id = /^\s*-?\s*id:\s*['"]?([A-Za-z0-9._/@-]+)/.exec(line)
      if (id !== null) ids.add(id[1])
      const name = /^\s*name:\s*['"]?([^'"\s]+)/.exec(line)
      if (name !== null) names.add(name[1])
    }
  } catch { /* no user patch file — nothing is user-managed */ }
  return { ids, names }
}

/** The plugin-manager row-id convention for one package name. */
export function rowIdFor(name: string): string {
  return name.replace(/^@/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
}

export function patchLayerManages(controls: { ids: Set<string>; names: Set<string> }, name: string): boolean {
  return controls.ids.has(rowIdFor(name)) || controls.names.has(name)
}
