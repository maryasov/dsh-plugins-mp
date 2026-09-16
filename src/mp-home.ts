/**
 * Profile & storage paths for the plugin's durable state.
 *
 * Everything the plugin persists lives under `<profile>/.dsh-mp/` — one
 * directory per profile, mirroring the profile-scoped layout of the DSH home
 * (`~/.dsh/profiles/<name>`). Home resolution follows the semantics of
 * `@deepseek-ai/dsh-home-paths` (DSH_HOME with tilde expansion, blank = unset);
 * the profile name comes from the loader config, else the running CLI's
 * `--profile` argument, else `web`.
 */
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/** The profile this host process actually booted (`--profile <name>`). */
export function argvProfile(): string | undefined {
  const argv = process.argv
  const flag = argv.indexOf('--profile')
  if (flag !== -1 && flag + 1 < argv.length && !argv[flag + 1].startsWith('-')) return argv[flag + 1]
  return undefined
}

/** Directory-name contract, aligned with app-boot's resolveProfileDir. */
export function isDshProfileName(profile: string): boolean {
  return profile !== ''
    && profile !== '.'
    && profile !== '..'
    && profile !== 'node_modules'
    && !profile.includes('/')
    && !profile.includes('\\')
    && !profile.includes('\0')
}

function expandHomePath(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(homedir(), path.slice(2))
  return path
}

export function resolveDshHome(): string {
  const fromEnv = process.env.DSH_HOME
  const selected = fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), '.dsh')
  return resolve(expandHomePath(selected))
}

/** `<DSH_HOME>/profiles/<profile>` — config override wins over the CLI argv. */
export function resolveProfileDir(config?: { profile?: string }): string {
  const name = config?.profile ?? argvProfile() ?? 'web'
  if (!isDshProfileName(name)) {
    throw new Error(`dsh-plugins-mp: invalid profile name ${JSON.stringify(name)}`)
  }
  return join(resolveDshHome(), 'profiles', name)
}

/** The plugin's durable-state directory inside the profile. */
export function resolveStateDir(config?: { profile?: string }): string {
  return join(resolveProfileDir(config), '.dsh-mp')
}
