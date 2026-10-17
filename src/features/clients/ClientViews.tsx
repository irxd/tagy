import type { ClientHint } from '@/domain/clients'
import { formatDate } from '@/domain/dates'
import { formatMoney } from '@/domain/money'
import type { DisplayStatus } from '@/domain/status'
import { cn } from '@/ui/cn'
import { Avatar } from '@/ui/Data'
import { StatusBadge } from '@/ui/Status'
import type { ClientRow } from './useClientRows'

const hints: Record<ClientHint, { status: DisplayStatus; label: string }> = {
  overdue: { status: 'overdue', label: 'Overdue' },
  unpaid: { status: 'sent', label: 'Unpaid' },
  draft: { status: 'draft', label: 'Draft ready' },
  paid: { status: 'paid', label: 'All paid' },
  new: { status: 'draft', label: 'No invoices' },
}

function avatarTone(hint: ClientHint) {
  return hint === 'overdue' ? 'danger' : hint === 'paid' ? 'quiet' : 'ink'
}

/** Whole dollars for compact lines: `$64,200 billed`. */
function shortMoney(minor: number, currency: string, locale: string) {
  return formatMoney(minor, currency, locale).replace(/[.,]00$/, '')
}

interface ViewProps {
  row: ClientRow
  locale: string
  selected?: boolean
  onOpen: () => void
}

/** Desktop · Clients card (Tile/Client Card). */
export function ClientCard({ row, locale, selected, onOpen }: ViewProps) {
  const { client, stats, currency } = row
  const hint = hints[stats.hint]
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={cn(
        'flex w-full flex-col gap-[18px] rounded-tile-lg border bg-tile-panel p-5 text-left transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent',
        selected ? 'border-tile-accent' : 'border-tile-border hover:border-tile-border-strong',
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3 py-1">
          <Avatar name={client.name} tone={avatarTone(stats.hint)} />
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-base font-bold tracking-[-0.2px]">{client.name}</span>
            <span className="truncate text-[13px] text-tile-muted">
              {client.email || client.contact || 'No email yet'}
            </span>
          </span>
        </span>
        <StatusBadge status={hint.status} label={client.archived ? 'Archived' : hint.label} />
      </span>
      <span className="grid grid-cols-2">
        <Figure
          value={stats.unpaid ? formatMoney(stats.unpaid, currency, locale) : '—'}
          label="Unpaid"
          tone={stats.overdue ? 'danger' : stats.unpaid ? 'fg' : 'subtle'}
        />
        <Figure value={formatMoney(stats.billed, currency, locale)} label="Total billed" />
      </span>
      <span className="grid grid-cols-3 gap-2">
        <Tile label="Invoices" value={String(stats.invoiceCount)} />
        <Tile label="Currency" value={currency} />
        <Tile
          label="Last"
          value={stats.lastIssueDate ? formatDate(stats.lastIssueDate, 'dd MMM') : '—'}
        />
      </span>
    </button>
  )
}

function Figure({
  value,
  label,
  tone = 'fg',
}: {
  value: string
  label: string
  tone?: 'fg' | 'danger' | 'subtle'
}) {
  const color = { fg: 'text-tile-fg', danger: 'text-tile-danger-ink', subtle: 'text-tile-subtle' }[
    tone
  ]
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className={cn('truncate text-[22px] font-bold tracking-[-0.5px] tabular-nums', color)}>
        {value}
      </span>
      <span className="text-[13px] text-tile-muted">{label}</span>
    </span>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-1 rounded-tile-md bg-tile-tile pt-2.5 pr-2.5 pb-3 pl-3">
      <span className="text-[13px] text-tile-muted">{label}</span>
      <span className="truncate text-[15px] font-bold">{value}</span>
    </span>
  )
}

/** Mobile · Clients list row. */
export function ClientListRow({ row, locale, onOpen }: ViewProps) {
  const { client, stats, currency } = row
  const hint = hints[stats.hint]
  const count = `${stats.invoiceCount} invoice${stats.invoiceCount === 1 ? '' : 's'}`
  return (
    <li className="border-b border-tile-border last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-tile-accent"
      >
        <Avatar name={client.name} tone={avatarTone(stats.hint)} className="size-[38px]" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold">{client.name}</span>
          <span className="truncate text-xs text-tile-muted">
            {count} · {shortMoney(stats.billed, currency, locale)} billed
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-[5px]">
          <span
            className={cn(
              'text-[15px] font-bold tabular-nums',
              stats.overdue
                ? 'text-tile-danger-ink'
                : stats.unpaid
                  ? 'text-tile-fg'
                  : 'text-tile-subtle',
            )}
          >
            {stats.unpaid ? formatMoney(stats.unpaid, currency, locale) : '—'}
          </span>
          <StatusBadge
            size="sm"
            status={hint.status}
            label={client.archived ? 'Archived' : hint.label}
          />
        </span>
      </button>
    </li>
  )
}
