/**
 * The shared host-side runtime: state access plus the live agent-tools
 * switch. Created once in the host `apply()`; the HTTP routes and the tools
 * wiring both talk to this object, so a Settings toggle can flip the model
 * facing tools without recomposing the plugin.
 */
import type { MpState } from './store.js'

export interface MpRuntime {
  /** Current durable state (fingerprint, toggles). */
  getState(): MpState
  /** Persist a partial update and return the new snapshot. */
  updateState(patch: Partial<Omit<MpState, 'schemaVersion' | 'fingerprint'>>): MpState
  /** The profile-scoped directory holding state.json. */
  stateDir(): string
  /** Register or dispose the mp_* tools live (no recompose). */
  setAgentTools(on: boolean): void
  /** Effective tools state after the switch settles. */
  agentToolsEnabled(): boolean
}
