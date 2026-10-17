import {
  ArrowLeftRight,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  ClockAlert,
  Copy,
  Download,
  Eye,
  PencilLine,
  Send,
  Undo2,
} from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { duplicateInvoice } from '@/db/invoices'
import { daysBetween, dueDateFor, formatDate, todayISO } from '@/domain/dates'
import { Button } from '@/ui/Button'
import { cn } from '@/ui/cn'
import { Avatar } from '@/ui/Data'
import { Menu, MenuDivider, MenuItem } from '@/ui/Menu'
import { StatusSelect, StatusStepper, type StepProps } from '@/ui/Status'
import { useToast } from '@/ui/toastContext'
import { ClientPicker } from './ClientPicker'
import { useDownloadPdf } from './useDownloadPdf'
import { useStatusChange } from './useStatusChange'
import { useEditor } from './useEditor'

/** Header status pill with the Draft / Sent / Paid menu (Editor — Status menu). */
export function StatusMenu() {
  const { invoice, status } = useEditor()
  const { change, dialog } = useStatusChange()
  return (
    <>
      <Menu trigger={<StatusSelect status={status} />} align="start">
        <MenuItem
          icon={PencilLine}
          label="Draft"
          description="Still editing — not counted yet"
          selected={invoice.status === 'draft'}
          onSelect={() => void change('draft')}
        />
        <MenuItem
          icon={Send}
          label="Sent"
          description="Shared with your client"
          selected={invoice.status === 'sent'}
          onSelect={() => void change('sent')}
        />
        <MenuItem
          icon={CircleCheck}
          label="Paid"
          description="Asks for the payment date"
          selected={invoice.status === 'paid'}
          onSelect={() => void change('paid')}
        />
        <MenuDivider />
        <DropdownMenu.Item
          disabled
          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] text-tile-muted outline-none"
        >
          <ClockAlert size={17} className="shrink-0 text-tile-subtle" aria-hidden />
          <span className="flex flex-col gap-px">
            <span className="text-sm font-semibold">Overdue is automatic</span>
            <span className="text-xs">Shown when the due date passes</span>
          </span>
        </DropdownMenu.Item>
      </Menu>
      {dialog}
    </>
  )
}

/** The hero card's left side: client, figures, stepper and the one-step-forward action. */
export function HeroSummary({ onPreview }: { onPreview: () => void }) {
  const { invoice, client, status, totals, money, date, today, set, settings, actions } =
    useEditor()
  const { change, openPaid, dialog } = useStatusChange()
  const pdf = useDownloadPdf()
  const [pickerOpen, setPickerOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const name = invoice.clientSnapshot?.name ?? client?.name
  const email = invoice.clientSnapshot?.email ?? client?.email
  // Dates (`2026-10-30`) and timestamps (sentAt, createdAt) → `30 Oct`, in local time.
  const short = (iso: string | null | undefined) =>
    iso ? formatDate(iso.length > 10 ? todayISO(new Date(iso)) : iso, 'd MMM') : null
  const dueIn = daysBetween(today, invoice.dueDate)

  async function duplicate() {
    const copy = await duplicateInvoice(invoice.id)
    toast({ message: `Duplicated as ${copy.number}` })
    navigate(`/invoices/${copy.id}`)
  }

  const second = {
    draft: { value: date(invoice.dueDate), label: 'Due date', danger: false },
    sent: {
      value: dueIn === 0 ? 'Due today' : `in ${dueIn} day${dueIn === 1 ? '' : 's'}`,
      label: `Due ${short(invoice.dueDate)}`,
      danger: false,
    },
    overdue: {
      value: `${-dueIn} day${dueIn === -1 ? '' : 's'} late`,
      label: `Was due ${short(invoice.dueDate)}`,
      danger: true,
    },
    paid: { value: short(invoice.paidAt) ?? '—', label: 'Paid on', danger: false },
  }[status]

  const sentStep: StepProps =
    status === 'overdue'
      ? {
          label: 'Overdue',
          date: `Due ${short(invoice.dueDate)}`,
          done: true,
          icon: CircleAlert,
          tone: 'danger',
        }
      : {
          label: 'Sent',
          date: short(invoice.sentAt) ?? 'Not yet',
          done: status !== 'draft',
          icon: status === 'sent' ? Send : CircleCheck,
          tone: status === 'sent' ? 'accent' : 'fg',
        }
  const steps: StepProps[] = [
    {
      label: 'Draft',
      date: status === 'draft' ? `Created ${short(invoice.createdAt)}` : short(invoice.createdAt),
      done: true,
      icon: status === 'draft' ? PencilLine : CircleCheck,
    },
    sentStep,
    {
      label: 'Paid',
      date:
        status === 'paid'
          ? short(invoice.paidAt)
          : status === 'overdue'
            ? 'Not yet'
            : `Due ${short(invoice.dueDate)}`,
      done: status === 'paid',
      tone: 'success',
    },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-[26px] px-1 pt-1.5 pb-1">
      <div className="flex items-center justify-between gap-3">
        {name ? (
          <div className="flex min-w-0 items-center gap-3 py-1">
            <Avatar name={name} />
            <div className="flex min-w-0 flex-col gap-px">
              <span className="truncate text-base font-bold tracking-[-0.2px]">{name}</span>
              <span className="truncate text-[13px] text-tile-muted">
                Bill to{email ? ` · ${email}` : ''}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[15px] text-tile-muted">No client yet</span>
        )}
        <Button icon={ArrowLeftRight} onClick={() => setPickerOpen(true)}>
          {name ? 'Change' : 'Choose client'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <HeroFigure
          value={money(totals.total)}
          label={status === 'paid' ? 'Paid in full' : 'Total due'}
        />
        <HeroFigure value={second.value} label={second.label} danger={second.danger} />
      </div>

      <StatusStepper steps={steps} />

      {status === 'paid' ? (
        <PaidBanner
          paidOn={invoice.paidAt ? formatDate(invoice.paidAt, 'd MMM, yyyy') : ''}
          detail={[invoice.paidMethod, invoice.paidNote].filter(Boolean).join(' · ')}
          onUndo={() => void actions.undoPaid()}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {status === 'draft' ? (
            <>
              <Button variant="dark" icon={Send} onClick={() => void change('sent')}>
                Mark as sent
              </Button>
              <Button icon={Copy} onClick={duplicate}>
                Duplicate
              </Button>
              <Button icon={Eye} onClick={onPreview}>
                Full preview
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" icon={CircleCheck} onClick={openPaid}>
                Mark as paid
              </Button>
              {status === 'sent' && (
                <Button icon={Undo2} onClick={() => void change('draft')}>
                  Back to draft
                </Button>
              )}
              <Button icon={Download} disabled={pdf.busy} onClick={() => void pdf.download()}>
                PDF
              </Button>
              {status === 'overdue' && (
                <Button icon={Copy} onClick={duplicate}>
                  Duplicate
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <ClientPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={invoice.clientId}
        onPick={(picked) => {
          // A draft takes the client's currency and terms; sent invoices keep theirs.
          if (invoice.status !== 'draft') return set({ clientId: picked.id })
          const terms = picked.terms ?? settings.terms
          set({
            clientId: picked.id,
            currency: picked.currency ?? settings.currency,
            terms,
            dueDate: dueDateFor(invoice.issueDate, terms),
          })
        }}
      />
      {dialog}
    </div>
  )
}

function HeroFigure({ value, label, danger }: { value: string; label: string; danger?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span
        className={cn(
          'truncate text-[28px] font-bold tracking-[-0.6px] tabular-nums',
          danger ? 'text-tile-danger' : 'text-tile-fg',
        )}
      >
        {value}
      </span>
      <span className="text-sm text-tile-muted">{label}</span>
    </div>
  )
}

function PaidBanner({
  paidOn,
  detail,
  onUndo,
}: {
  paidOn: string
  detail: string
  onUndo: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-tile-md bg-tile-success-soft py-2.5 pr-2.5 pl-3.5">
      <CircleCheckBig size={20} className="shrink-0 text-tile-success" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-sm font-bold text-tile-success">Paid on {paidOn}</span>
        {detail && <span className="truncate text-xs text-tile-muted">{detail}</span>}
      </div>
      <Button variant="outline" icon={Undo2} onClick={onUndo}>
        Undo
      </Button>
    </div>
  )
}
