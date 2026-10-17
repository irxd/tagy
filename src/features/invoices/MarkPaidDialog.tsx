import { CalendarDays, Check, CircleCheck, Info } from 'lucide-react'
import { useState } from 'react'
import { addDays } from '@/domain/dates'
import { Button } from '@/ui/Button'
import { DateField, SelectField, TextField } from '@/ui/Field'
import { Overlay } from '@/ui/Overlay'
import type { Invoice } from '@/db/types'
import { todayISO } from '@/domain/dates'
import type { Payment } from '@/domain/status'
import { useLayout } from '@/ui/useLayout'

const PAYMENT_METHODS = ['Bank transfer', 'Card', 'Cash', 'PayPal', 'Wise', 'Other']

export interface MarkPaidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Pick<Invoice, 'number' | 'dueDate'>
  clientName: string | undefined
  /** Formatted total, e.g. `$12,927.60`. */
  total: string
  /** Formats a calendar date the way the user chose in Settings. */
  date: (iso: string) => string
  onConfirm: (payment: Payment) => Promise<void>
}

/** Mark as paid dialog (desktop) / sheet (mobile): date, method, note. */
export function MarkPaidDialog({
  open,
  onOpenChange,
  invoice,
  clientName: who,
  total,
  date,
  onConfirm,
}: MarkPaidDialogProps) {
  const today = todayISO()
  const mobile = useLayout() === 'mobile'
  const [paidAt, setPaidAt] = useState(today)
  const [method, setMethod] = useState(PAYMENT_METHODS[0]!)
  const [note, setNote] = useState('')

  const quick = [
    { label: 'Today', value: today },
    { label: 'Yesterday', value: addDays(today, -1) },
    { label: 'Due date', value: invoice.dueDate },
  ]

  return (
    <Overlay
      open={open}
      onOpenChange={onOpenChange}
      icon={CircleCheck}
      tone="success"
      title="Mark as paid"
      description={[invoice.number, who].filter(Boolean).join(' · ')}
      actions={
        <>
          <Button size={mobile ? 'lg' : 'md'} variant="soft" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size={mobile ? 'lg' : 'md'}
            variant="primary"
            icon={Check}
            onClick={async () => {
              await onConfirm({ paidAt, method, note: note.trim() })
              onOpenChange(false)
            }}
          >
            Mark as paid
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-between rounded-tile-md bg-tile-tile px-4 py-3.5">
        <span className="text-sm text-tile-muted">Amount</span>
        <span className="text-[22px] font-bold tabular-nums">{total}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <DateField
            label="Paid on"
            display={date(paidAt)}
            value={paidAt}
            max={today}
            onChange={(e) => e.target.value && setPaidAt(e.target.value)}
          />
          <SelectField
            label="Method"
            value={method}
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            onChange={(e) => setMethod(e.target.value)}
          />
        </div>
        <TextField
          label="Note (optional)"
          placeholder="e.g. Chase ref 88213"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[13px] text-tile-muted">Quick:</span>
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              aria-pressed={paidAt === q.value}
              onClick={() => setPaidAt(q.value)}
              className="inline-flex items-center gap-1.5 rounded-full bg-tile-tile px-2.5 py-1 text-xs font-semibold text-tile-muted hover:bg-tile-tile-strong aria-pressed:bg-tile-fg aria-pressed:text-white"
            >
              <CalendarDays size={14} aria-hidden />
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <p className="flex gap-2.5 text-[13px] text-tile-muted">
        <Info size={16} className="mt-px shrink-0" aria-hidden />
        Moves {total} from Unpaid to Paid on your Overview. You can undo this anytime.
      </p>
    </Overlay>
  )
}
