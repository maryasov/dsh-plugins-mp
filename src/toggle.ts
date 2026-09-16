/**
 * Live plugin disable/enable: the toggle keeps its durable choice as a
 * marker-delimited row in the profile's `cordis.patch.yml` — the loader's
 * user-patch watcher recomposes within ~1s, and the choice is re-applied on
 * every boot. Plugins live through one of our hot mounts toggle instantly
 * via dispose/re-mount instead; the patch row then decides the NEXT boot.
 *
 * Every row we write sits inside `# >>> dsh-mp <rowId>` / `# <<< dsh-mp
 * <rowId>` comment markers, so enable = deleting exactly our lines and a
 * hand-edited file is never made worse (structure elsewhere is untouched).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { logEvent } from './log.js'
import { rowIdFor } from './hot.js'

function blockFor(rowId: string): string {
  return [
    `# >>> dsh-mp disable ${rowId} (managed — toggle in Settings → Маркетплейс)`,
    `- id: ${rowId}`,
    `  disabled: true`,
    `# <<< dsh-mp disable ${rowId}`,
    '',
  ].join('\n')
}

function blockRange(lines: string[], rowId: string): { start: number; end: number } | null {
  // The begin marker carries a human-readable suffix on write — match it by
  // prefix; the end marker is written bare.
  const begin = `# >>> dsh-mp disable ${rowId}`
  const end = `# <<< dsh-mp disable ${rowId}`
  const start = lines.findIndex((line) => line.trim().startsWith(begin))
  if (start === -1) return null
  const stop = lines.findIndex((line, i) => i > start && line.trim() === end)
  if (stop === -1) return null
  return { start, end: stop }
}

/** Whether a managed disable row currently exists for the row id. */
export function isDisabledByPatch(profileDir: string, name: string): boolean {
  const file = join(profileDir, 'cordis.patch.yml')
  if (!existsSync(file)) return false
  const text = readFileSync(file, 'utf8')
  return text.includes(`# >>> dsh-mp disable ${rowIdFor(name)}`)
}

/**
 * Write or remove the managed disable row. Returns false when the user
 * patch already manages the row id itself (an insert or a hand-written
 * disable) — we refuse to fight it and the caller reports the conflict.
 */
export function setPatchDisabled(profileDir: string, name: string, disable: boolean): { ok: boolean; conflict?: boolean } {
  const rowId = rowIdFor(name)
  const file = join(profileDir, 'cordis.patch.yml')
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : []
  const existing = blockRange(lines, rowId)

  if (disable) {
    // A non-ours mention of the row id means the user (or another tool)
    // manages this row — overriding it silently would be worse than asking.
    const userControls = /^-\s*id:\s*(?:['"]?)/
    const managedElsewhere = lines.some((line, i) =>
      userControls.test(line) && line.includes(rowId) && (existing === null || i < existing.start || i > existing.end))
    if (managedElsewhere) return { ok: false, conflict: true }
    if (existing !== null) return { ok: true }
    if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
    lines.push(...blockFor(rowId).split('\n'))
  } else {
    if (existing === null) return { ok: true }
    lines.splice(existing.start, existing.end - existing.start + 1)
  }

  writeFileSync(file, lines.join('\n'), 'utf8')
  logEvent('info', 'toggle', `${name}: ${disable ? 'disabled' : 'enabled'} via patch row (${file})`)
  return { ok: true }
}
