import { createContext, useContext } from 'react'

export interface ToastOptions {
  message: string
  /** e.g. Undo — shown only for reversible actions. */
  action?: { label: string; onClick: () => void }
}

export const ToastContext = createContext<((options: ToastOptions) => void) | null>(null)

/** Shows one toast at a time; a new toast replaces the current one. */
export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
