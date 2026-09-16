/**
 * Event log for issue reports: what the plugin did and how it failed,
 * exportable as plain text from `GET /plugins/dsh-plugins-mp/logs`.
 *
 * Privacy: entries are sanitized on write — the home directory collapses to
 * `~`, and value-shaped secrets (tokens, keys) are redacted before a string
 * is stored. The buffer is in-memory only; nothing is ever sent anywhere.
 */
import { homedir } from 'node:os'

export type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  at: string
  level: LogLevel
  scope: string
  message: string
}

const RING_MAX = 500
const ring: LogEntry[] = []

const HOME = homedir()
/** Bearer-style and assignment-style secret shapes, masked before storing. */
const SECRET_SHAPE = /((?:bearer\s+|token[=:]|key[=:]|password[=:])\S+)/gi

export function sanitizeLogText(message: string): string {
  let text = message.split(HOME).join('~')
  text = text.replace(SECRET_SHAPE, () => '[redacted]')
  return text
}

export function logEvent(level: LogLevel, scope: string, message: string): void {
  const entry: LogEntry = {
    at: new Date().toISOString(),
    level,
    scope,
    message: sanitizeLogText(message).slice(0, 2000),
  }
  ring.push(entry)
  if (ring.length > RING_MAX) ring.splice(0, ring.length - RING_MAX)
}

/** The whole buffer as one human-readable plain-text blob (log-file shaped). */
export function exportLog(): string {
  const head = [
    'dsh-plugins-mp event log',
    `exported: ${new Date().toISOString()}`,
    `entries: ${ring.length}`,
    ''.padEnd(60, '-'),
  ]
  const lines = ring.map((e) => `${e.at} ${e.level.toUpperCase().padEnd(5)} [${e.scope}] ${e.message}`)
  return [...head, ...lines, ''].join('\n')
}
