/**
 * Stable, versioned contract for plugin-owned update surfaces (plan #27).
 *
 * Third-party plugins and tools must not depend on the marketplace UI's
 * internal response shapes, so this module owns the small JSON envelope
 * exposed under `/plugins/dsh-plugins-mp/api/v1`.
 *
 * Ported from dsh-market (MIT) src/update-api-v1.ts; the envelope fields are
 * kept identical so a client written against theirs works against ours.
 * Progress is narrower: our update executor is a CLI run, so phases beyond
 * install are not observable.
 */
import { randomUUID } from 'node:crypto'

export const UPDATE_API_V1_SCHEMA = 'dsh-plugins-mp/update-api/v1' as const
export const MAX_UPDATE_OPERATIONS_V1 = 50

export type UpdateOperationState =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'rolled-back'

export interface UpdateFailureV1 {
  code: string
  message: string
  retryable: boolean
}

export interface UpdateOperationV1 {
  schema: typeof UPDATE_API_V1_SCHEMA
  operationId: string
  kind: 'update'
  packageName: string
  state: UpdateOperationState
  createdAt: number
  startedAt: number | null
  finishedAt: number | null
  beforeVersion: string | null
  installedVersion: string | null
  progress: {
    phase: string | null
    done: number
    total: number | null
    percent: number | null
    currentPackage: string | null
    detail: string | null
    downloaded: number | null
    size: number | null
  }
  outcome: {
    refreshRequired: boolean
    restartRequired: boolean
    rollback: {
      available: boolean
      state: 'unavailable' | 'available' | 'running' | 'succeeded' | 'failed'
      detail: string | null
    }
  }
  failure: UpdateFailureV1 | null
}

/** Retryable failure codes — a client may re-ask later. */
const RETRYABLE_CODES = new Set([
  'AGENTS_RUNNING',
  'OPERATION_BUSY',
  'UPDATE_TIMEOUT',
  'VERSION_UNCHANGED',
])

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/**
 * Map an executor failure to the machine-readable code set. `failureCode` on
 * the payload wins (our routes may pre-classify), then structural signals.
 */
export function failureOf(status: number, body: Record<string, unknown>): UpdateFailureV1 {
  const explicit = text(body.failureCode)
  let code: string
  if (explicit !== null) code = explicit
  else if (body.agentsBusy === true) code = 'AGENTS_RUNNING'
  else if (body.busy === true || status === 409) code = 'OPERATION_BUSY'
  else if (body.timedOut === true) code = 'UPDATE_TIMEOUT'
  else if (status === 403) code = 'UPDATE_FORBIDDEN'
  else if (status === 404) code = 'PLUGIN_NOT_INSTALLED'
  else if (status === 400) code = 'UPDATE_REJECTED'
  else code = 'UPDATE_FAILED'
  const message = text(body.error)
    ?? text(body.stderr)
    ?? text(body.output)
    ?? `update failed with HTTP ${String(status)}`
  return {
    code,
    message: message.slice(-1200),
    retryable: RETRYABLE_CODES.has(code),
  }
}

const emptyProgress = (): UpdateOperationV1['progress'] => ({
  phase: null,
  done: 0,
  total: null,
  percent: null,
  currentPackage: null,
  detail: null,
  downloaded: null,
  size: null,
})

/** Process-local operation registry. A boot id scopes ids across restarts. */
export class UpdateOperationStoreV1 {
  private sequence = 0
  private readonly operations = new Map<string, StoredOperation>()
  private activeId: string | null = null

  constructor(
    private readonly bootId: string,
    private readonly now: () => number = Date.now,
    private readonly maxOperations: number = MAX_UPDATE_OPERATIONS_V1,
  ) {}

  hasActive(): boolean {
    return this.activeId !== null
  }

  create(packageName: string, beforeVersion: string | null, rollbackId: string | null): UpdateOperationV1 {
    const operationId = `${this.bootId}-update-${String(++this.sequence)}`
    const createdAt = this.now()
    const operation: StoredOperation = {
      schema: UPDATE_API_V1_SCHEMA,
      operationId,
      kind: 'update',
      packageName,
      state: 'queued',
      createdAt,
      startedAt: null,
      finishedAt: null,
      beforeVersion,
      installedVersion: beforeVersion,
      progress: emptyProgress(),
      outcome: {
        refreshRequired: false,
        restartRequired: false,
        rollback: rollbackId !== null
          ? { available: true, state: 'available', detail: null }
          : { available: false, state: 'unavailable', detail: null },
      },
      failure: null,
      rollbackId,
    }
    this.operations.set(operationId, operation)
    this.activeId = operationId
    while (this.operations.size > this.maxOperations) {
      const oldestId = this.operations.keys().next().value as string | undefined
      if (oldestId === undefined || oldestId === this.activeId) break
      this.operations.delete(oldestId)
    }
    return this.snapshot(operation)
  }

  start(operationId: string): void {
    const operation = this.operations.get(operationId)
    if (operation === undefined) return
    operation.state = 'running'
    operation.startedAt = this.now()
    operation.progress.phase = 'install'
    this.activeId = operationId
  }

  finish(
    operationId: string,
    ok: boolean,
    failureBody: Record<string, unknown> | null,
    installedVersion: string | null,
    restartRequired: boolean,
  ): UpdateOperationV1 | null {
    const operation = this.operations.get(operationId)
    if (operation === undefined) return null
    operation.state = ok ? 'succeeded' : 'failed'
    operation.finishedAt = this.now()
    operation.installedVersion = installedVersion
    operation.failure = ok ? null : failureOf(500, failureBody ?? {})
    operation.progress.phase = null
    operation.outcome.restartRequired = restartRequired
    if (this.activeId === operationId) this.activeId = null
    return this.snapshot(operation)
  }

  beginRollback(operationId: string): string | null {
    const operation = this.operations.get(operationId)
    if (operation?.rollbackId === null || operation?.rollbackId === undefined) return null
    operation.outcome.rollback.state = 'running'
    operation.outcome.rollback.detail = null
    return operation.rollbackId
  }

  finishRollback(
    operationId: string,
    ok: boolean,
    error: string | null,
    installedVersion?: string | null,
  ): UpdateOperationV1 | null {
    const operation = this.operations.get(operationId)
    if (operation === undefined) return null
    if (installedVersion !== undefined) operation.installedVersion = installedVersion
    operation.outcome.rollback.available = !ok
    operation.outcome.rollback.state = ok ? 'succeeded' : 'failed'
    operation.outcome.rollback.detail = ok ? null : error ?? 'rollback failed'
    if (ok) {
      operation.state = 'rolled-back'
      operation.outcome.restartRequired = true
    }
    return this.snapshot(operation)
  }

  get(operationId: string): UpdateOperationV1 | null {
    const operation = this.operations.get(operationId)
    if (operation === undefined) return null
    return this.snapshot(operation)
  }

  private snapshot(operation: StoredOperation): UpdateOperationV1 {
    const { rollbackId: _rollbackId, ...view } = operation
    return structuredClone(view)
  }
}

interface StoredOperation extends UpdateOperationV1 {
  /** Profile snapshot id captured before the update (rollback handle). */
  rollbackId: string | null
}

/** Stable per-process boot scope for operation ids. */
export function apiBootId(): string {
  return `${randomUUID().slice(0, 8)}-${String(process.pid)}`
}
