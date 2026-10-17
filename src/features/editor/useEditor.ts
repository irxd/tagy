import { createContext, useContext, useState } from 'react'
import { trackSave } from '@/app/saveStatus'
import { useAutosave } from '@/app/useAutosave'
import { useClient, useInvoice, useSettings } from '@/db/hooks'
import { restoreInvoice, updateInvoice, type InvoicePatch } from '@/db/invoices'
import type { AppSettings, Client, Invoice } from '@/db/types'
import { formatDate, todayISO } from '@/domain/dates'
import { formatMoney } from '@/domain/money'
import {
  backToDraft,
  displayStatus,
  markPaid,
  markSent,
  undoPaid,
  type DisplayStatus,
  type Payment,
} from '@/domain/status'
import { computeTotals, invoiceTaxPct, type Totals } from '@/domain/totals'
import { useToast } from '@/ui/toastContext'

export interface Editor {
  invoice: Invoice
  settings: AppSettings
  client: Client | undefined
  status: DisplayStatus
  totals: Totals
  taxPct: number | null
  today: string
  /** Edit fields; autosaves after a short pause. */
  set: (patch: InvoicePatch) => void
  money: (minor: number) => string
  date: (iso: string, pattern?: string) => string
  actions: {
    send: () => Promise<void>
    backToDraft: () => Promise<void>
    markPaid: (payment: Payment) => Promise<void>
    undoPaid: () => Promise<void>
  }
}

/**
 * Loads one invoice for editing. Inputs read the stored record with this
 * session's edits on top, so typing never waits on IndexedDB; edits autosave.
 * Status changes write straight away, after flushing pending edits.
 * Returns `null` when the invoice doesn't exist, `undefined` while loading.
 */
export function useEditorState(id: string): Editor | null | undefined {
  const stored = useInvoice(id)
  const settings = useSettings()
  const [edits, setEdits] = useState<InvoicePatch>({})
  const { queue, flush } = useAutosave<InvoicePatch>((patch) => updateInvoice(id, patch))
  const invoice = stored ? { ...stored, ...edits } : stored
  const client = useClient(invoice?.clientId ?? undefined)
  const toast = useToast()

  if (invoice === null) return null
  if (!invoice || !settings) return undefined
  const today = todayISO()
  const taxPct = invoiceTaxPct(invoice, settings.taxRates)
  const totals = computeTotals({ items: invoice.items, discountPct: invoice.discountPct, taxPct })
  const money = (minor: number) => formatMoney(minor, invoice.currency, settings.locale)
  const date = (iso: string, pattern = settings.dateFormat) => formatDate(iso, pattern)

  function set(patch: InvoicePatch) {
    setEdits((e) => ({ ...e, ...patch }))
    queue(patch)
  }

  async function write(patch: InvoicePatch) {
    flush()
    // Status fields aren't in `edits`, so the overlay can't mask the change.
    await trackSave(updateInvoice(id, patch))
  }

  const current = invoice
  const actions: Editor['actions'] = {
    async send() {
      const taxRate = settings.taxRates.find((t) => t.id === current.taxRateId)
      await write(
        markSent(current, {
          now: new Date().toISOString(),
          client,
          business: settings.business,
          taxRate,
        }),
      )
      toast({ message: `${current.number} marked as sent` })
    },
    async backToDraft() {
      await write(backToDraft(current))
    },
    async markPaid(payment) {
      const before = current
      await write(markPaid(current, payment))
      toast({
        message: `${current.number} marked as paid · ${formatDate(payment.paidAt, 'd MMM')}`,
        action: { label: 'Undo', onClick: () => void restoreInvoice(before) },
      })
    },
    async undoPaid() {
      await write(undoPaid(current))
    },
  }

  return {
    invoice,
    settings,
    client,
    status: displayStatus(invoice, today),
    totals,
    taxPct,
    today,
    set,
    money,
    date,
    actions,
  }
}

export const EditorContext = createContext<Editor | null>(null)

export function useEditor(): Editor {
  const editor = useContext(EditorContext)
  if (!editor) throw new Error('useEditor must be used inside the invoice editor')
  return editor
}
