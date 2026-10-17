import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * "A new version is ready — Reload". Shown when the service worker has an
 * update; the app never reloads on its own, so nothing typed is lost.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-4 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-full bg-tile-fg py-2.5 pr-2.5 pl-4 text-white shadow-[0_12px_32px_#1a1f2b40]"
    >
      <RefreshCw size={17} className="shrink-0 text-[#4ade80]" aria-hidden />
      <span className="min-w-0 flex-1 text-sm font-semibold">A new version of Tagy is ready</span>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="shrink-0 rounded-full bg-white/12 px-3 py-[5px] text-[13px] font-bold hover:bg-white/20"
      >
        Reload
      </button>
      <button
        type="button"
        aria-label="Later"
        onClick={() => setNeedRefresh(false)}
        className="grid size-6 shrink-0 place-items-center rounded-full text-white/50 hover:text-white"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}
