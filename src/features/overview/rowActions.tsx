import {
  CircleCheck,
  Copy,
  Download,
  Ellipsis,
  FileText,
  HardDriveDownload,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { formatDate } from '@/domain/dates'
import {
  deleteInvoice,
  downloadInvoiceById,
  draftInvoice,
  duplicateInvoice,
  payInvoice,
  restoreInvoice,
  sendInvoice,
  unpayInvoice,
} from '@/features/invoices/actions'
import { MarkPaidDialog } from '@/features/invoices/MarkPaidDialog'
import { IconButton } from '@/ui/Button'
import { Menu, MenuDivider, MenuItem } from '@/ui/Menu'
import { ConfirmDialog } from '@/ui/Overlay'
import { useToast } from '@/ui/toastContext'
import type { InvoiceRow } from './useOverview'

/**
 * The row "…" menu (Overview — Row menu) and the dialogs it opens. One
 * mark-as-paid dialog and one delete confirm serve every row.
 */
export function useRowActions(date: (iso: string) => string) {
  const toast = useToast()
  const navigate = useNavigate()
  const [paying, setPaying] = useState<InvoiceRow | null>(null)
  const [deleting, setDeleting] = useState<InvoiceRow | null>(null)

  const fail = () => toast({ message: 'Something went wrong — try again' })

  function menu(row: InvoiceRow) {
    const { invoice, status } = row
    const id = invoice.id
    return (
      <Menu trigger={<IconButton icon={Ellipsis} label={`Actions for ${invoice.number}`} />}>
        {status === 'draft' && (
          <MenuItem
            icon={Send}
            label="Mark as sent"
            description="Counts as unpaid from now"
            onSelect={() =>
              void sendInvoice(id)
                .then(() => toast({ message: `${invoice.number} marked as sent` }))
                .catch(fail)
            }
          />
        )}
        {(status === 'sent' || status === 'overdue') && (
          <MenuItem
            icon={CircleCheck}
            label="Mark as paid"
            description={
              status === 'overdue' ? `Overdue · ${row.total}` : 'Record the payment date'
            }
            onSelect={() => setPaying(row)}
          />
        )}
        {status === 'paid' && (
          <MenuItem
            icon={Undo2}
            label="Mark as unpaid"
            description="Back to Sent, payment cleared"
            onSelect={() => void unpayInvoice(id).catch(fail)}
          />
        )}
        <MenuItem
          icon={FileText}
          label="Open & edit"
          onSelect={() => navigate(`/invoices/${id}`)}
        />
        <MenuItem
          icon={Copy}
          label="Duplicate"
          onSelect={() =>
            void duplicateInvoice(id)
              .then((copy) => {
                toast({ message: `Duplicated as ${copy.number}` })
                navigate(`/invoices/${copy.id}?step=details`)
              })
              .catch(fail)
          }
        />
        <MenuItem
          icon={Download}
          label="Download PDF"
          onSelect={() => void downloadInvoiceById(id).catch(fail)}
        />
        {(status === 'sent' || status === 'overdue') && (
          <MenuItem
            icon={Undo2}
            label="Back to draft"
            onSelect={() => void draftInvoice(id).catch(fail)}
          />
        )}
        <MenuDivider />
        <MenuItem
          icon={Trash2}
          label="Delete invoice"
          tone="danger"
          onSelect={() => setDeleting(row)}
        />
      </Menu>
    )
  }

  const dialogs = (
    <>
      {paying && (
        <MarkPaidDialog
          open
          onOpenChange={(open) => !open && setPaying(null)}
          invoice={paying.invoice}
          clientName={paying.clientName}
          total={paying.total}
          date={date}
          onConfirm={async (payment) => {
            const before = await payInvoice(paying.invoice.id, payment)
            toast({
              message: `${paying.invoice.number} marked as paid · ${formatDate(payment.paidAt, 'd MMM')}`,
              action: { label: 'Undo', onClick: () => void restoreInvoice(before) },
            })
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          icon={Trash2}
          tone="danger"
          title={`Delete ${deleting.invoice.number}?`}
          description={`This removes the ${deleting.total} invoice for ${deleting.clientName} from this browser. There's no account to restore it from, so it can't be recovered later.`}
          confirmLabel="Delete invoice"
          confirmIcon={Trash2}
          onConfirm={async () => {
            const removed = await deleteInvoice(deleting.invoice.id)
            if (removed)
              toast({
                message: `${removed.number} deleted`,
                action: { label: 'Undo', onClick: () => void restoreInvoice(removed) },
              })
          }}
        >
          <p className="flex items-center gap-2.5 rounded-tile-md bg-tile-tile px-3 py-2.5 text-[13px] text-tile-muted">
            <HardDriveDownload size={16} className="shrink-0" aria-hidden />
            Not sure? Export a backup first from Settings.
          </p>
        </ConfirmDialog>
      )}
    </>
  )

  return { menu, dialogs }
}
