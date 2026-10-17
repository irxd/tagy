import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { useSaveStatus } from './saveStatus'

/** "All changes saved" from the Settings and editor headers. */
export function SaveIndicator() {
  const status = useSaveStatus()
  const view = {
    saving: { Icon: LoaderCircle, text: 'Saving…', icon: 'animate-spin text-tile-muted' },
    saved: { Icon: CircleCheck, text: 'All changes saved', icon: 'text-tile-success-ink' },
    error: { Icon: CircleAlert, text: "Couldn't save — try again", icon: 'text-tile-danger-ink' },
  }[status]
  return (
    <span aria-live="polite" className="inline-flex items-center gap-1.5 text-sm text-tile-muted">
      <view.Icon size={15} className={view.icon} aria-hidden />
      {view.text}
    </span>
  )
}
