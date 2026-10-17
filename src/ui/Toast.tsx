import { CircleCheck, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from './cn'
import { ToastContext, type ToastOptions } from './toastContext'

/** How long a toast stays, per the handoff. */
export const TOAST_MS = 6_000

interface ToastState extends ToastOptions {
  id: number
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const nextId = useRef(0)

  const show = useCallback((options: ToastOptions) => {
    setToast({ ...options, id: ++nextId.current })
  }, [])

  const dismiss = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismiss, TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Always mounted so screen readers announce new messages. Bottom-centre
          on desktop; above the tab bar / action bar on mobile. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(100px+env(safe-area-inset-bottom))] z-[60] flex justify-center desk:bottom-6"
      >
        {toast && <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />}
      </div>
    </ToastContext.Provider>
  )
}

function ToastView({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex max-w-full items-center gap-3 rounded-full bg-tile-fg py-2.5 pr-2.5 pl-3.5 text-white shadow-[0_12px_32px_#1a1f2b40]',
        'animate-[toast-in_180ms_ease-out]',
      )}
    >
      <CircleCheck size={18} className="shrink-0 text-[#4ade80]" aria-hidden />
      <span className="min-w-0 truncate text-sm font-semibold">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick()
            onDismiss()
          }}
          className="shrink-0 rounded-full bg-white/12 px-3 py-[5px] text-[13px] font-bold hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid size-6 shrink-0 place-items-center rounded-full text-white/50 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}
