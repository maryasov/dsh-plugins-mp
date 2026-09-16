/**
 * One targeted, line-based edit of the profile's `pnpm-workspace.yaml`:
 * adding entries to the `allowBuilds` map pnpm ≥10 consults before running
 * dependency build scripts. The file is otherwise owned by pnpm and the dsh
 * CLI — this module never rewrites anything beyond appending
 * `<pkg>: true` lines under the existing (or freshly appended) key.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Merge packages into the allowBuilds map.
 * @returns the added names; a name already allowed (or already present in
 * the text) is skipped.
 */
export function allowBuildsAdd(profileDir: string, packages: readonly string[]): { added: string[]; file: string } {
  const file = join(profileDir, 'pnpm-workspace.yaml')
  const original = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const lines = original.split('\n')
  const added: string[] = []
  const hasEntry = (name: string): boolean =>
    lines.some((line) => line.trimEnd() === `  ${name}: true`) ||
    new RegExp(`^\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`).test(original)

  const keyIndex = lines.findIndex((line) => /^allowBuilds:\s*$/.test(line))
  if (keyIndex === -1) {
    // No map yet: append one at the end of the file.
    if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
    lines.push('allowBuilds:')
    for (const name of packages) {
      if (!hasEntry(name)) {
        lines.push(`  ${name}: true`)
        added.push(name)
      }
    }
  } else {
    // Insert directly under the key, before the next top-level key.
    let insertAt = keyIndex + 1
    while (insertAt < lines.length && (lines[insertAt].startsWith(' ') || lines[insertAt].trim() === '')) insertAt++
    for (const name of packages) {
      if (hasEntry(name)) continue
      lines.splice(insertAt, 0, `  ${name}: true`)
      insertAt++
      added.push(name)
    }
  }

  if (added.length > 0) {
    mkdirGuard(profileDir)
    writeFileSync(file, lines.join('\n'), 'utf8')
  }
  return { added, file }
}

function mkdirGuard(dir: string): void {
  // pnpm-workspace.yaml only exists in an initialized profile; the guard
  // keeps the failure shape the same when the directory is missing entirely.
  if (!existsSync(dir)) throw new Error(`profile directory does not exist: ${dir}`)
}
