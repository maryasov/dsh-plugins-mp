/**
 * Locate the DSH host package this plugin is running inside and report its
 * version (adapted from dsh-market's dshHostInfo): walk up from the CLI entry
 * looking for a package.json whose name is @deepseek-ai/dsh.
 */
import { readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DSH_PACKAGE = '@deepseek-ai/dsh'

function readManifest(directory: string): { name?: unknown; version?: unknown } | null {
  try {
    return JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
  } catch {
    return null
  }
}

function realpathOf(entry: string): string {
  try {
    return realpathSync(entry)
  } catch {
    return entry
  }
}

export function dshHostInfo(entry = process.argv[1]): { version: string; directory: string } | null {
  let dir: string | null = null
  try {
    dir = dirname(realpathOf(entry ?? ''))
  } catch {
    return null
  }
  if (!dir) return null
  for (let i = 0; i < 12; i++) {
    const manifest = readManifest(dir)
    if (manifest?.name === DSH_PACKAGE) {
      const version = typeof manifest.version === 'string' && manifest.version !== ''
        ? manifest.version
        : 'unknown'
      return { version, directory: dir }
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
  return null
}
