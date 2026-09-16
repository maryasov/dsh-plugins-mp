/**
 * Profile snapshots: before any ordering / uninstall / update / disable
 * change is applied, the composition-critical files are captured as a
 * timestamped snapshot; a failed or unwanted change can be rolled back in
 * one step. Kept under `<profile>/.dsh-mp/snapshots/<id>/`, newest kept
 * (MAX_SNAPSHOTS), never leaving the machine.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { logEvent } from './log.js'

const SNAPSHOT_DIR = join('.dsh-mp', 'snapshots')
const FILES = ['cordis.patch.yml', 'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml'] as const
export const MAX_SNAPSHOTS = 5

export interface SnapshotInfo {
  id: string
  files: string[]
}

function snapshotRoot(profileDir: string): string {
  return join(profileDir, SNAPSHOT_DIR)
}

/** Capture the composition-critical files; id = millisecond timestamp. */
export function snapshotCreate(profileDir: string, reason: string): string | null {
  try {
    const id = String(Date.now())
    const target = join(snapshotRoot(profileDir), id)
    let copied = 0
    for (const file of FILES) {
      const source = join(profileDir, file)
      if (!existsSync(source)) continue
      mkdirSync(target, { recursive: true })
      cpSync(source, join(target, file))
      copied++
    }
    if (copied === 0) return null
    mkdirSync(target, { recursive: true })
    writeReason(target, reason)
    prune(profileDir)
    logEvent('info', 'snapshot', `${id} (${reason}): ${copied} file(s)`)
    return id
  } catch (error) {
    // A failed snapshot must never block the operation it protects.
    logEvent('warn', 'snapshot', `failed: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function writeReason(target: string, reason: string): void {
  writeFileSync(join(target, 'reason.txt'), `${reason}\n`, 'utf8')
}

function prune(profileDir: string): void {
  const root = snapshotRoot(profileDir)
  let entries: string[]
  try {
    entries = readdirSync(root).filter((name) => /^\d+$/.test(name)).sort()
  } catch {
    return
  }
  while (entries.length > MAX_SNAPSHOTS) {
    const oldest = entries.shift()
    if (oldest !== undefined) rmSync(join(root, oldest), { recursive: true, force: true })
  }
}

/** All snapshots, oldest first. */
export function snapshotList(profileDir: string): SnapshotInfo[] {
  const root = snapshotRoot(profileDir)
  let entries: string[]
  try {
    entries = readdirSync(root).filter((name) => /^\d+$/.test(name)).sort()
  } catch {
    return []
  }
  return entries.map((id) => {
    const dir = join(root, id)
    return {
      id,
      files: readdirSync(dir).filter((name) => FILES.includes(name as (typeof FILES)[number])),
    }
  })
}

/** Restore one snapshot, first taking a safety snapshot of the current state. */
export function snapshotRestore(profileDir: string, id: string): { ok: boolean; error?: string } {
  const dir = join(snapshotRoot(profileDir), id)
  if (!existsSync(dir) || !/^\d+$/.test(id)) return { ok: false, error: 'no such snapshot' }
  snapshotCreate(profileDir, `safety before restore ${id}`)
  try {
    for (const file of readdirSync(dir)) {
      if (!FILES.includes(file as (typeof FILES)[number])) continue
      cpSync(join(dir, file), join(profileDir, file))
    }
    logEvent('info', 'snapshot', `restored ${id}`)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Delete one snapshot (frees nothing but clutter; snapshots are tiny). */
export function snapshotDelete(profileDir: string, id: string): boolean {
  if (!/^\d+$/.test(id)) return false
  const dir = join(snapshotRoot(profileDir), id)
  if (!existsSync(dir)) return false
  rmSync(dir, { recursive: true, force: true })
  return true
}
