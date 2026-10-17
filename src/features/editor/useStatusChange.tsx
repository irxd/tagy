import { useState } from 'react'
import type { InvoiceStatus } from '@/db/types'
import { MarkPaidDialog } from './MarkPaidDialog'
import { useEditor } from './useEditor'

/**
 * Moves the invoice to `target`, going through Sent where the lifecycle
 * requires it (Draft → Paid sends first; Paid → Draft undoes the payment
 * first). Paid always goes through the dialog for the payment date.
 */
export function useStatusChange() {
  const { invoice, actions } = useEditor()
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

  const dialog = <MarkPaidDialog open={paidOpen} onOpenChange={setPaidOpen} />
  return { change, openPaid: () => setPaidOpen(true), dialog }
}
