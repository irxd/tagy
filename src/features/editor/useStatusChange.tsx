import { useState } from 'react'
import type { InvoiceStatus } from '@/db/types'
import { MarkPaidDialog } from '@/features/invoices/MarkPaidDialog'
import { useEditor } from './useEditor'

/**
 * Moves the invoice to `target`, going through Sent where the lifecycle
 * requires it (Draft → Paid sends first; Paid → Draft undoes the payment
 * first). Paid always goes through the dialog for the payment date.
 */
export function useStatusChange() {
  const { invoice, client, actions, money, totals, date } = useEditor()
  const [paidOpen, setPaidOpen] = useState(false)

  async function change(target: InvoiceStatus) {
    const from = invoice.status
    if (target === from) return
    if (target === 'paid') {
      if (from === 'draft') await actions.send()
      setPaidOpen(true)
    } else if (target === 'sent') {
      await (from === 'draft' ? actions.send() : actions.undoPaid())
    } else {
      if (from === 'paid') await actions.undoPaid()
      await actions.backToDraft()
    }
  }

  const dialog = (
    <MarkPaidDialog
      open={paidOpen}
      onOpenChange={setPaidOpen}
      invoice={invoice}
      clientName={invoice.clientSnapshot?.name ?? client?.name}
      total={money(totals.total)}
      date={(iso) => date(iso)}
      onConfirm={actions.markPaid}
    />
  )
  return { change, openPaid: () => setPaidOpen(true), dialog }
}
