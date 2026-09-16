/**
 * Self-restart so pending (non-hot) plugin changes take effect without the
 * user leaving the UI — with the two failure modes dsh-market taught us:
 *
 * 1. Under systemd, killing the process from inside is fatal to the unit
 *    (the cgroup kill takes the replacement down with it). When the host IS
 *    a unit's main process we hand off to `systemctl --user restart` instead.
 * 2. Under a plain terminal launch, the successor must be detached (setsid)
 *    and must WAIT for the old process to exit before exec'ing the exact
 *    same invocation — racing the old process for the port is the "restart
 *    always errors" bug the user hit with dsh-market.
 *
 * The UI never waits in-process either way: it polls `GET /status` until
 * `pid` (and the boot id) changes.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logEvent } from './log.js'

/** Read the cgroup line to find the owning unit, e.g. `dsh-web.service`. */
function systemdUnit(): string | null {
  try {
    const cgroup = readFileSync('/proc/self/cgroup', 'utf8')
    // The cgroup path is deepest-last: `…/user@1000.service/app.slice/dsh-web.service`.
    // The user manager itself (user@<uid>.service) also ends in .service —
    // restarting THAT would take the whole session down, so it is skipped and
    // the LAST service component wins.
    const matches = [...cgroup.matchAll(/([\w@.-]+\.service)/g)].map((m) => m[1])
    const scoped = matches.filter((unit) => !/^user@\d+\.service$/.test(unit))
    const chosen = scoped[scoped.length - 1] ?? null
    return chosen
  } catch {
    return null
  }
}

/**
 * Whether THIS process is the systemd unit's own main process. INVOCATION_ID
 * alone is not enough: every descendant of a unit inherits it (an ordinary
 * terminal included). We additionally require the unit's MainPID to equal
 * our pid — only then may a restart be handed to systemctl.
 */
export function detectSystemd(): { unit: string | null; isMain: boolean } {
  const invocation = process.env.INVOCATION_ID
  const unit = systemdUnit()
  if (invocation === undefined || unit === null) return { unit: null, isMain: false }
  // The plugin's routes usually run in a CHILD of the unit's MainPID
  // (pnpm spawns node); restart-by-systemctl is correct when MainPID is one
  // of our ancestors — restarting the unit then takes us down and up cleanly.
  try {
    const result = spawnSync('systemctl', ['--user', 'show', unit, '-p', 'MainPID', '--value'], {
      encoding: 'utf8',
      timeout: 5000,
    })
    const mainPid = Number.parseInt((result.stdout ?? '').trim(), 10)
    if (!Number.isInteger(mainPid) || mainPid <= 0) return { unit, isMain: false }
    let current: number | null = process.pid
    for (let depth = 0; current !== null && depth < 12; depth++) {
      if (current === mainPid) return { unit, isMain: true }
      const status = readFileSync(`/proc/${String(current)}/status`, 'utf8')
      const m = /^PPid:\s+(\d+)/m.exec(status)
      current = m !== null ? Number(m[1]) : null
    }
    return { unit, isMain: false }
  } catch {
    return { unit, isMain: false }
  }
}

export interface RestartOutcome {
  mode: 'systemd' | 'successor'
  detail: string
}

/**
 * Trigger the restart. Returns AFTER the trigger is armed, never after the
 * host actually goes down.
 */
export function triggerRestart(profileDir: string): RestartOutcome {
  const { unit, isMain } = detectSystemd()
  if (unit !== null && isMain) {
    const child = spawn('systemctl', ['--user', 'restart', unit], { detached: true, stdio: 'ignore' })
    child.unref()
    logEvent('info', 'restart', `handed off to systemctl --user restart ${unit} (pid ${child.pid})`)
    return { mode: 'systemd', detail: `systemctl --user restart ${unit}` }
  }

  // Plain-launch branch: a detached successor waits for our exit, then
  // re-execs the exact invocation (same argv, cwd, env).
  const script = [
    '#!/bin/sh',
    '# dsh-plugins-mp restart successor: waits for the old process, then',
    '# re-execs the exact DSH invocation. Armed by the market UI.',
    `OLD_PID=${String(process.pid)}`,
    `while [ -d /proc/$OLD_PID ]; do sleep 0.3; done`,
    `cd ${JSON.stringify(process.cwd())}`,
    `exec ${JSON.stringify(process.execPath)} ${process.execArgv.map((a) => JSON.stringify(a)).join(' ')} ${JSON.stringify(process.argv[1] ?? '')} ${process.argv.slice(2).map((a) => JSON.stringify(a)).join(' ')}`,
    '',
  ].join('\n')
  const file = join(profileDir, '.dsh-mp', 'restart-successor.sh')
  writeFileSync(file, script, { mode: 0o755 })
  const child = spawn('setsid', ['sh', file], { detached: true, stdio: 'ignore', env: process.env })
  child.unref()
  logEvent('info', 'restart', `successor script armed (pid ${child.pid}) — exiting now`)
  return { mode: 'successor', detail: file }
}

/** Best-effort liveness fingerprint for the UI's poll-until-changed loop. */
export function statusFingerprint(): { pid: number; boot: string; systemd: string | null } {
  const { unit } = detectSystemd()
  return {
    pid: process.pid,
    boot: process.env.INVOCATION_ID ?? `${process.pid}-${Math.floor(process.uptime() * 1000)}`,
    systemd: unit,
  }
}

/** Whether the successor script is still armed but has not fired (stale). */
export function successorPending(profileDir: string): boolean {
  return existsSync(join(profileDir, '.dsh-mp', 'restart-successor.sh'))
}
