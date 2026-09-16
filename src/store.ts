/**
 * The plugin's durable state: one `state.json` inside the profile's
 * `.dsh-mp/` directory. Written atomically (tmp file + rename) and only ever
 * through {@link updateMpState} / {@link saveMpState} — readers get a plain
 * snapshot. A missing or corrupt file falls back to defaults; unknown
 * schema versions keep loading when the shape is a superset (additive
 * evolution), otherwise defaults win.
 */
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const SCHEMA_VERSION = 1 as const

export interface MpState {
  schemaVersion: typeof SCHEMA_VERSION
  /** Anonymous install-telemetry identity: a random UUID, nothing hardware-derived. */
  fingerprint: string
  /** Whether the five mp_* model-facing tools are registered (Settings toggle). */
  agentTools: boolean
}

function defaults(): MpState {
  return { schemaVersion: SCHEMA_VERSION, fingerprint: randomUUID(), agentTools: true }
}

export function statePath(dir: string): string {
  return join(dir, 'state.json')
}

/** Load the state file, repairing anything unreadable back to defaults. */
export function loadMpState(dir: string): MpState {
  const fallback = defaults()
  try {
    const raw = existsSync(statePath(dir)) ? readFileSync(statePath(dir), 'utf8') : null
    if (raw === null) return fallback
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed.schemaVersion !== SCHEMA_VERSION) return fallback
    return {
      schemaVersion: SCHEMA_VERSION,
      fingerprint: typeof parsed.fingerprint === 'string' && parsed.fingerprint !== ''
        ? parsed.fingerprint
        : fallback.fingerprint,
      agentTools: parsed.agentTools !== false,
    }
  } catch {
    return fallback
  }
}

/** Persist the state atomically; the directory is created on demand. */
export function saveMpState(dir: string, state: MpState): void {
  mkdirSync(dir, { recursive: true })
  const tmp = join(dir, `.state-${process.pid}-${Date.now()}.tmp`)
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  renameSync(tmp, statePath(dir))
}
