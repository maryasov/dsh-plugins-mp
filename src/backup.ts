/**
 * Portable profile backups: configuration only, never installed packages.
 * Format-compatible with dsh-market's `dsh-profile-backup` v0.2, so backups
 * restore across both plugins.
 *
 * The profile directory is plain user data — aside from package.json it can
 * hold API keys, tokens, or provider passwords. The export therefore carries
 * a credential-warning disclaimer in the UI, and restore is a MERGE: current
 * dependencies stay, backup specs win on name conflicts, bundle lists are
 * unioned — a restore never deletes plugins the target machine already has.
 *
 * Ported from dsh-market (MIT) src/backup.ts; adapted: `.dsh-mp/state.json`
 * (favorites/notes/groups/theme) is carried and merged field-wise, snapshot
 * and hot-mount scratch files are excluded, and the WebDAV/Gist transport
 * lives elsewhere (plan #12).
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { loadMpState, SCHEMA_VERSION } from './store.js'

export const BACKUP_FORMAT = 'dsh-profile-backup'
export const BACKUP_VERSION = 0.2 as const
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024
const MAX_FILES = 256
const SKIP_NAMES = new Set(['node_modules', '.dsh-market', '.git', 'pnpm-lock.yaml'])

/** File names that routinely contain credentials — surfaced by the UI warning. */
export const SECRET_FILE_HINTS = /(^|\/)(config\.toml|\.env(\.\w+)?|secrets?\.\w+t?j?s?n|pnpm-workspace\.yaml)$/i

export type BackupFile =
  | { path: 'package.json'; json: Record<string, unknown> }
  | { path: string; lines: string[] }

export interface ProfileBackup {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  createdAt: string
  profile: string
  files: BackupFile[]
}

function profileFiles(root: string, dir = root): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // Any .bak marker, not just ours — recovery paths leave other shapes, and
    // a backup that carried them would restore the wreckage back (#dsh-market #205).
    if (SKIP_NAMES.has(entry.name) || /\.bak\b/.test(entry.name)) continue
    const path = resolve(dir, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) files.push(...profileFiles(root, path))
    else if (entry.isFile()) files.push(relative(root, path).split(sep).join('/'))
    if (files.length > MAX_FILES) throw new Error(`profile has more than ${MAX_FILES} configuration files`)
  }
  return files
}

/** Count of exported files whose names look like they carry credentials. */
export function secretFileCount(profileDir: string): number {
  let count = 0
  for (const path of profileFiles(profileDir)) {
    if (SECRET_FILE_HINTS.test(path)) count += 1
  }
  return count
}

/**
 * Files that travel in a backup: the whole config surface except dependency
 * state, market cache, snapshots and hot-mount scratch inputs. Our
 * `.dsh-mp/state.json` (favorites/notes/groups/theme) is included.
 */
function backupableFiles(root: string): string[] {
  return profileFiles(root).filter((path) => {
    if (path === 'package.json') return true
    if (!path.startsWith('.dsh-mp/')) return true
    return path === '.dsh-mp/state.json'
  })
}

/** Serialize the profile configuration into one portable JSON file. */
export function createProfileBackup(profileDir: string, profileName: string): ProfileBackup {
  const manifestFile = resolve(profileDir, 'package.json')
  if (!existsSync(manifestFile)) throw new Error('profile package.json is missing')
  const files: BackupFile[] = backupableFiles(profileDir).sort().map((path) => {
    const content = readFileSync(resolve(profileDir, path), 'utf8')
    return path === 'package.json'
      ? { path, json: JSON.parse(content) as Record<string, unknown> }
      : { path, lines: content.split(/\r?\n/) }
  })
  if (!files.some((file) => file.path === 'package.json')) throw new Error('profile package.json is missing')
  const backup: ProfileBackup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    profile: profileName,
    files,
  }
  if (Buffer.byteLength(JSON.stringify(backup)) > MAX_BACKUP_BYTES) {
    throw new Error('profile configuration is too large to back up')
  }
  return backup
}

export function validatedBackup(value: unknown): ProfileBackup {
  if (value === null || typeof value !== 'object') throw new Error('invalid backup')
  const backup = value as Partial<ProfileBackup>
  if (backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION || !Array.isArray(backup.files)) {
    throw new Error('unsupported backup format')
  }
  if (backup.files.length > MAX_FILES) throw new Error('invalid backup contents')
  const files: BackupFile[] = []
  const paths = new Set<string>()
  for (const entry of backup.files as unknown[]) {
    if (entry === null || typeof entry !== 'object') throw new Error('invalid backup contents')
    const file = entry as { path?: unknown; json?: unknown; lines?: unknown }
    const path = file.path
    if (typeof path !== 'string') throw new Error('invalid backup contents')
    if (path === '' || isAbsolute(path) || path.split(/[\\/]/).includes('..')) throw new Error(`unsafe backup path: ${path}`)
    const normalized = path.replaceAll('\\', '/')
    if (normalized.split('/').some((part) => SKIP_NAMES.has(part))) throw new Error(`excluded backup path: ${path}`)
    if (paths.has(normalized)) throw new Error(`duplicate backup path: ${path}`)
    paths.add(normalized)
    if (path === 'package.json') {
      if (file.json === null || typeof file.json !== 'object' || Array.isArray(file.json)) throw new Error('backup package.json is invalid')
      files.push({ path, json: file.json as Record<string, unknown> })
    } else {
      if (!Array.isArray(file.lines) || !file.lines.every((line) => typeof line === 'string')) throw new Error(`invalid file content: ${path}`)
      files.push({ path, lines: file.lines as string[] })
    }
  }
  if (!files.some((file) => file.path === 'package.json')) throw new Error('invalid backup contents')
  if (Buffer.byteLength(JSON.stringify(backup)) > MAX_BACKUP_BYTES) throw new Error('backup is too large')
  return { ...backup, files } as ProfileBackup
}

/**
 * Atomically write the backup's files over the profile and return a rollback
 * restoring every touched path. The caller owns the merge decision — pass the
 * MERGED manifest in `backup.packageJson` to get merge semantics.
 */
export function restoreProfileBackup(
  profileDir: string,
  backup: ProfileBackup,
  packageJson: Record<string, unknown>,
): { files: number; rollback(): void } {
  const root = resolve(profileDir)
  const previous = new Map<string, Buffer | null>()
  mkdirSync(root, { recursive: true })
  const rollback = (): void => {
    for (const [target, content] of previous) {
      if (content === null) rmSync(target, { force: true })
      else writeFileSync(target, content)
    }
  }
  try {
    for (const file of backup.files) {
      const { path } = file
      const target = resolve(root, path)
      if (!target.startsWith(root + sep)) throw new Error(`unsafe backup path: ${path}`)
      ensureSafeParent(root, dirname(target), path)
      if (existsSync(target) && !lstatSync(target).isFile()) throw new Error(`backup path is not a file: ${path}`)
      previous.set(target, existsSync(target) ? readFileSync(target) : null)
      const content = path === 'package.json'
        ? `${JSON.stringify(packageJson, null, 2)}\n`
        : `${(file as { lines: string[] }).lines.join('\n')}`
      const temp = `${target}.dsh-restore-${String(process.pid)}`
      writeFileSync(temp, content, 'utf8')
      renameSync(temp, target)
    }
  } catch (error) {
    rollback()
    throw error
  }
  return { files: previous.size, rollback }
}

/** Create missing parents one level at a time and refuse existing symlinks. */
function ensureSafeParent(root: string, parent: string, backupPath: string): void {
  const relativeParent = relative(root, parent)
  if (relativeParent === '') return
  let current = root
  for (const part of relativeParent.split(sep)) {
    current = resolve(current, part)
    if (!existsSync(current)) {
      mkdirSync(current)
      continue
    }
    const stat = lstatSync(current)
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`unsafe backup path: ${backupPath}`)
  }
}

/**
 * Dependencies whose spec points at an absolute local path (`link:/Users/…`,
 * `file:/home/…`): valid on the source machine, meaningless elsewhere.
 * Reported, NOT rewritten — naming them lets the operator decide.
 */
export function unportableDeps(dependencies: unknown): Array<{ name: string; spec: string }> {
  if (dependencies === null || typeof dependencies !== 'object' || Array.isArray(dependencies)) return []
  const found: Array<{ name: string; spec: string }> = []
  for (const [name, raw] of Object.entries(dependencies as Record<string, unknown>)) {
    if (typeof raw !== 'string') continue
    const match = /^(?:link|file):(.+)$/i.exec(raw)
    if (match === null) continue
    let path = match[1]
    try { path = decodeURIComponent(path) } catch { /* keep the literal spec */ }
    if (/^\//.test(path) || /^[A-Za-z]:[\\/]/.test(path) || /^\\\\/.test(path)) found.push({ name, spec: raw })
  }
  return found
}

/**
 * Merge the backup's manifest into the current one: current deps stay, backup
 * specs win on name conflicts, bundle lists are unioned (de-duplicated).
 * Everything else in the manifest comes from the CURRENT profile.
 */
export function mergeRestoreManifest(
  backupManifest: Record<string, unknown>,
  current: Record<string, unknown>,
): Record<string, unknown> {
  const manifest = { ...current }
  const backupDeps = backupManifest.dependencies !== null && typeof backupManifest.dependencies === 'object' && !Array.isArray(backupManifest.dependencies)
    ? backupManifest.dependencies as Record<string, unknown>
    : {}
  const currentDeps = current.dependencies !== null && typeof current.dependencies === 'object' && !Array.isArray(current.dependencies)
    ? current.dependencies as Record<string, unknown>
    : {}
  manifest.dependencies = { ...currentDeps, ...backupDeps }

  const backupBundles = Array.isArray((backupManifest.dsh as { profile?: { bundles?: unknown } } | undefined)?.profile?.bundles)
    ? (backupManifest.dsh as { profile: { bundles: unknown[] } }).profile.bundles
    : []
  const currentBundles = Array.isArray((current.dsh as { profile?: { bundles?: unknown } } | undefined)?.profile?.bundles)
    ? (current.dsh as { profile: { bundles: unknown[] } }).profile.bundles
    : []
  const bundles = new Set<string>()
  for (const name of currentBundles) if (typeof name === 'string') bundles.add(name)
  for (const name of backupBundles) if (typeof name === 'string') bundles.add(name)

  const currentDsh = current.dsh !== null && typeof current.dsh === 'object' && !Array.isArray(current.dsh)
    ? current.dsh as { profile?: Record<string, unknown> }
    : {}
  manifest.dsh = {
    ...currentDsh,
    profile: { ...(currentDsh.profile ?? {}), bundles: [...bundles] },
  }
  return manifest
}

/**
 * Field-wise merge of the carried `.dsh-mp/state.json`: the CURRENT
 * fingerprint (telemetry identity) and agentTools always stay; favorites are
 * unioned; notes merge with backup winning per slug; groups merge by name
 * with member union; theme fills only an empty slot.
 */
export function mergeRestoreState(currentRaw: string | null, backupRaw: string | null): string {
  const fallback = { schemaVersion: SCHEMA_VERSION }
  const current = safeParse(currentRaw) ?? fallback
  const backup = safeParse(backupRaw) ?? {}
  const currentRec = current as Record<string, unknown>
  const backupRec = backup as Record<string, unknown>

  const favorites = new Set<string>(
    Array.isArray(currentRec.favorites) ? currentRec.favorites.filter((x): x is string => typeof x === 'string') : [],
  )
  for (const x of Array.isArray(backupRec.favorites) ? backupRec.favorites : []) {
    if (typeof x === 'string') favorites.add(x)
  }

  const notes = (currentRec.notes !== null && typeof currentRec.notes === 'object' && !Array.isArray(currentRec.notes)
    ? { ...(currentRec.notes as Record<string, unknown>) }
    : {})
  const backupNotes = backupRec.notes !== null && typeof backupRec.notes === 'object' && !Array.isArray(backupRec.notes)
    ? backupRec.notes as Record<string, unknown>
    : {}
  for (const [slug, text] of Object.entries(backupNotes)) notes[slug] = text

  const groups = new Map<string, { name: string; members: string[] }>()
  const addGroup = (list: unknown): void => {
    for (const entry of Array.isArray(list) ? list : []) {
      if (entry === null || typeof entry !== 'object') continue
      const rec = entry as { name?: unknown; members?: unknown }
      if (typeof rec.name !== 'string' || !Array.isArray(rec.members)) continue
      const members = rec.members.filter((m): m is string => typeof m === 'string')
      const existing = groups.get(rec.name.toLowerCase())
      if (existing === undefined) groups.set(rec.name.toLowerCase(), { name: rec.name, members })
      else for (const m of members) if (!existing.members.includes(m)) existing.members.push(m)
    }
  }
  addGroup(currentRec.groups)
  addGroup(backupRec.groups)

  const merged = {
    ...currentRec,
    schemaVersion: SCHEMA_VERSION,
    fingerprint: typeof currentRec.fingerprint === 'string' && currentRec.fingerprint !== ''
      ? currentRec.fingerprint
      : backupRec.fingerprint,
    favorites: [...favorites],
    notes,
    groups: [...groups.values()],
    theme: currentRec.theme ?? backupRec.theme ?? null,
  }
  // Round-trip through the state loader so every cap/sanitizer applies.
  return JSON.stringify(sanitizeStateJson(merged), null, 2)
}

function safeParse(raw: string | null): unknown {
  if (raw === null) return null
  try { return JSON.parse(raw) } catch { return null }
}

/** Sanitize via the real store: write to a temp dir, load, delete. Caps and shapes guaranteed. */
function sanitizeStateJson(value: Record<string, unknown>): ReturnType<typeof loadMpState> {
  const tmp = mkdtempSync(join(tmpdir(), 'dsh-mp-restore-'))
  try {
    writeFileSync(join(tmp, 'state.json'), JSON.stringify(value), 'utf8')
    return loadMpState(tmp)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

/** The state.json contents the EXPORT should carry (already sanitized shape). */
export function stateFileForBackup(profileDir: string): string | null {
  const path = resolve(profileDir, '.dsh-mp', 'state.json')
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}
