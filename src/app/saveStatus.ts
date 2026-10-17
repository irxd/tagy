import { useSyncExternalStore } from 'react'

/*
 * Tracks autosave writes app-wide so headers can show "Saving…" /
 * "All changes saved" without each form wiring its own state.
 */

let pending = 0
let failed = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** Wraps a write so the indicator counts it while it runs. */
export async function trackSave<T>(write: Promise<T>): Promise<T> {
  pending++
  failed = false
  emit()
  try {
    return await write
  } catch (error) {
    failed = true
    throw error
  } finally {
    pending--
    emit()
  }
}

export type SaveStatus = 'saving' | 'saved' | 'error'

function getSnapshot(): SaveStatus {
  if (failed) return 'error'
  return pending > 0 ? 'saving' : 'saved'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSaveStatus(): SaveStatus {
  return useSyncExternalStore(subscribe, getSnapshot)
}
