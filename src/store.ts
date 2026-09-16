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

export interface MpGroup {
  name: string
  /** Installed package names — a group toggles its members as one unit. */
  members: string[]
}

export interface MpState {
  schemaVersion: typeof SCHEMA_VERSION
  /** Anonymous install-telemetry identity: a random UUID, nothing hardware-derived. */
  fingerprint: string
  /** Whether the five mp_* model-facing tools are registered (Settings toggle). */
  agentTools: boolean
  /** Favorite marketplace slugs (Favorites tab), capped defensively. */
  favorites: string[]
  /** Per-plugin notes (plan #21, v1 local): slug → free-form text. */
  notes: Record<string, string>
  /** Active theme (plan #23): remembered so switching can auto-disable it. */
  theme: { slug: string; name: string } | null
  /** Named plugin groups (plan #15): toggle all members as a unit. */
  groups: MpGroup[]
}

const MAX_NOTES = 200
const MAX_NOTE_CHARS = 2000
const MAX_GROUPS = 20
const MAX_GROUP_MEMBERS = 50

const GROUP_NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,39}$/u
export const isValidGroupName = (name: string): boolean => GROUP_NAME_RE.test(name)

function sanitizeNotes(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {}
  const out: Record<string, string> = {}
  for (const [slug, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof slug !== 'string' || slug.length === 0 || slug.length > 200) continue
    if (typeof text !== 'string' || text.trim() === '') continue
    if (Object.keys(out).length >= MAX_NOTES) break
    out[slug] = text.slice(0, MAX_NOTE_CHARS)
  }
  return out
}

function sanitizeTheme(value: unknown): { slug: string; name: string } | null {
  if (typeof value !== 'object' || value === null) return null
  const rec = value as Record<string, unknown>
  if (typeof rec.slug !== 'string' || rec.slug === '' || typeof rec.name !== 'string' || rec.name === '') {
    return null
  }
  return { slug: rec.slug, name: rec.name }
}

function sanitizeGroups(value: unknown): MpGroup[] {
  if (!Array.isArray(value)) return []
  const out: MpGroup[] = []
  const seen = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue
    const rec = entry as { name?: unknown; members?: unknown }
    if (typeof rec.name !== 'string' || !GROUP_NAME_RE.test(rec.name)) continue
    const key = rec.name.toLowerCase()
    if (seen.has(key) || out.length >= MAX_GROUPS) continue
    seen.add(key)
    const members = Array.isArray(rec.members)
      ? [...new Set(rec.members.filter((m): m is string => typeof m === 'string' && PACKAGE_NAME_RE.test(m)))]
          .slice(0, MAX_GROUP_MEMBERS)
      : []
    out.push({ name: rec.name, members })
  }
  return out
}

// Mirrors routes.ts PACKAGE_RE — duplicated here because routes.ts imports
// this module (an import back would be circular).
const PACKAGE_NAME_RE = /^(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]{0,119}$/

function defaults(): MpState {
  return {
    schemaVersion: SCHEMA_VERSION,
    fingerprint: randomUUID(),
    agentTools: true,
    favorites: [],
    notes: {},
    theme: null,
    groups: [],
  }
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
      favorites: Array.isArray(parsed.favorites)
        ? parsed.favorites
            .filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 200)
            .slice(0, 500)
        : [],
      notes: sanitizeNotes(parsed.notes),
      theme: sanitizeTheme(parsed.theme),
      groups: sanitizeGroups(parsed.groups),
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
