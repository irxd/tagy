import { useCallback, useEffect, useRef } from 'react'
import { trackSave } from './saveStatus'

/** Typing pauses longer than this are written to IndexedDB. */
export const AUTOSAVE_MS = 400

/**
 * Collects patches and writes them in one call after a short pause. Pending
 * changes are flushed on unmount and when the tab is hidden, so nothing typed
 * is lost by navigating away or closing the tab.
 */
export function useAutosave<P extends object>(commit: (patch: P) => Promise<unknown>) {
  const queued = useRef<P | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const commitRef = useRef(commit)
  useEffect(() => {
    commitRef.current = commit
  })

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const patch = queued.current
    queued.current = null
    if (patch) void trackSave(commitRef.current(patch))
  }, [])

  const queue = useCallback(
    (patch: P) => {
      queued.current = { ...queued.current, ...patch } as P
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, AUTOSAVE_MS)
    },
    [flush],
  )

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush()
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [flush])

  return { queue, flush }
}
