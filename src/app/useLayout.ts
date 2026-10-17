import { useSyncExternalStore } from 'react'

export type Layout = 'desktop' | 'mobile'

// Matches --breakpoint-desk in styles/index.css.
const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function getSnapshot(): Layout {
  return window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'mobile'
}

/** Desktop (rail + panel) at ≥ 1024 px, mobile (tab bar) below. */
export function useLayout(): Layout {
  return useSyncExternalStore(subscribe, getSnapshot)
}
