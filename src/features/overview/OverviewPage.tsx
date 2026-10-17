import {
  CircleAlert,
  ChevronRight,
  Copy,
  HardDrive,
  Download,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useBlobUrl } from '@/db/hooks'
import { duplicateInvoice } from '@/db/invoices'
import { daysBetween, formatDate, timeAgo } from '@/domain/dates'
import { formatMoney } from '@/domain/money'
import { matchesInvoice, PERIOD_LABELS, type Period } from '@/domain/overview'
import type { DisplayStatus } from '@/domain/status'
import { Button } from '@/ui/Button'
import { DropdownButton, FilterPill, MiniChip } from '@/ui/Chip'
import { cn } from '@/ui/cn'
import { Avatar, Stat } from '@/ui/Data'
import { initials } from '@/ui/initials'
import { Menu, MenuItem } from '@/ui/Menu'
import { PageHeader } from '@/ui/PageHeader'
import { StatusBadge } from '@/ui/Status'
import { useToast } from '@/ui/toastContext'
import { useLayout } from '@/ui/useLayout'
import { FirstVisit } from './FirstVisit'
import { useRowActions } from './rowActions'
import { useOverview, type InvoiceRow, type Overview } from './useOverview'

type Filter = DisplayStatus | 'all'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
]

const avatarTone = (s: DisplayStatus) =>
  s === 'overdue' ? 'danger' : s === 'paid' ? 'quiet' : 'ink'

export function OverviewPage() {
  const overview = useOverview()
  const layout = useLayout()
  if (!overview) return null
  if (overview.empty) return <FirstVisit />
  return layout === 'desktop' ? <DesktopOverview o={overview} /> : <MobileOverview o={overview} />
}

/* ---------- shared ---------- */

function useListState(o: Overview) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const visible = o.rows.filter(
    (r) =>
      (filter === 'all' || r.status === filter) && matchesInvoice(r.invoice, r.clientName, query),
  )
  return { filter, setFilter, query, setQuery, visible }
}

function Filters({
  o,
  filter,
  onFilter,
  surface,
}: {
  o: Overview
  filter: Filter
  onFilter: (f: Filter) => void
  surface: 'tile' | 'panel'
}) {
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 desk:mx-0 desk:px-0">
      {FILTERS.map((f) => (
        <FilterPill
          key={f.key}
          active={filter === f.key}
          count={o.stats.counts[f.key]}
          surface={surface}
          onClick={() => onFilter(f.key)}
        >
          {f.label}
        </FilterPill>
      ))}
    </div>
  )
}

function SearchField({
  value,
  onChange,
  className,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  autoFocus?: boolean
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 rounded-full px-3.5 py-[9px] focus-within:outline-2 focus-within:outline-tile-accent',
        className,
      )}
    >
      <Search size={15} className="shrink-0 text-tile-muted" aria-hidden />
      <input
        type="search"
        aria-label="Search client or invoice no."
        placeholder="Search client or invoice no."
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-tile-subtle"
      />
    </label>
  )
}

function PeriodMenu({ o }: { o: Overview }) {
  return (
    <Menu trigger={<DropdownButton>{PERIOD_LABELS[o.period]}</DropdownButton>}>
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <MenuItem
          key={p}
          icon={TrendingUp}
          label={PERIOD_LABELS[p]}
          selected={o.period === p}
          onSelect={() => o.setPeriod(p)}
        />
      ))}
    </Menu>
  )
}

/** Billed per month: white bars, the best month in accent with its amount. */
function Bars({ o, height, compact }: { o: Overview; height: number; compact?: boolean }) {
  const max = Math.max(...o.stats.months.map((m) => m.billed), 1)
  return (
    <div
      role="img"
      aria-label={`Billed per month: ${o.stats.months.map((m) => `${m.label} ${o.compact(m.billed)}`).join(', ')}`}
      className={cn('flex items-end', compact ? 'gap-2' : 'gap-2.5')}
      style={{ height }}
    >
      {o.stats.months.map((m) => {
        const best = o.stats.best?.month === m.month
        return (
          <div
            key={m.month}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            {best && !compact && (
              <span className="rounded-full bg-tile-fg px-2 py-[3px] text-[11px] font-bold text-white">
                {o.compact(m.billed)}
              </span>
            )}
            <span
              className={cn(
                'w-full',
                compact ? 'rounded-md' : 'rounded-[10px]',
                best ? 'bg-tile-accent' : 'bg-white/80',
              )}
              style={{
                height: `${Math.max(6, (m.billed / max) * (height - (compact ? 22 : 52)))}px`,
              }}
            />
            <span
              className={cn(
                compact ? 'text-[11px]' : 'text-xs',
                best ? 'font-bold text-tile-fg' : 'text-tile-muted',
              )}
            >
              {m.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function headline(o: Overview) {
  const best = o.stats.best
  if (!best) return 'Nothing billed yet'
  const name = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${best.month}-01T00:00:00Z`),
  )
  return best.month === o.stats.months.at(-1)!.month
    ? `${name} is your best month`
    : `${name} was your best month`
}

function useDuplicateLast(o: Overview) {
  const navigate = useNavigate()
  const toast = useToast()
  const last = o.rows.toSorted((a, b) => b.invoice.createdAt.localeCompare(a.invoice.createdAt))[0]
  return last
    ? async () => {
        const copy = await duplicateInvoice(last.invoice.id)
        toast({ message: `Duplicated ${last.invoice.number} as ${copy.number}` })
        navigate(`/invoices/${copy.id}`)
      }
    : undefined
}

function dueLine(row: InvoiceRow, o: Overview) {
  const { invoice, status } = row
  if (status === 'paid')
    return {
      text: `paid ${invoice.paidAt ? formatDate(invoice.paidAt, 'd MMM') : ''}`.trim(),
      late: false,
    }
  if (status === 'overdue') {
    const days = daysBetween(invoice.dueDate, o.today)
    return { text: `${days} day${days === 1 ? '' : 's'} late`, late: true }
  }
  return { text: `due ${formatDate(invoice.dueDate, 'd MMM')}`, late: false }
}

/* ---------- desktop ---------- */

function DesktopOverview({ o }: { o: Overview }) {
  const list = useListState(o)
  const { menu, dialogs } = useRowActions((iso) => o.date(iso))
  const duplicateLast = useDuplicateLast(o)
  const b = o.settings.business
  const logoUrl = useBlobUrl(b.logoBlobId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        subtitle="Your invoices at a glance — saved privately in this browser"
        actions={
          <>
            <PeriodMenu o={o} />
            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-[7px] rounded-full bg-tile-fg py-[9px] pr-4 pl-[13px] text-sm font-semibold text-white hover:bg-tile-fg/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent"
            >
              <Plus size={15} aria-hidden />
              New invoice
            </Link>
          </>
        }
      />

      <section
        aria-label="Summary"
        className="flex gap-6 rounded-tile-lg border border-tile-border p-5"
      >
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 px-1 pt-1.5 pb-1">
          <div className="flex flex-col gap-[22px]">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="size-9 rounded-full bg-white object-contain" />
              ) : (
                <span
                  className="grid size-9 place-items-center rounded-full bg-tile-fg text-xs font-bold text-white"
                  aria-hidden
                >
                  {b.name ? initials(b.name) : '?'}
                </span>
              )}
              <div className="flex flex-col gap-px">
                <span className="text-base font-bold tracking-[-0.2px]">
                  {b.name || 'Your business'}
                </span>
                <span className="text-[13px] text-tile-muted">
                  {o.stats.rangeLabel} · {o.stats.counts.all} invoice
                  {o.stats.counts.all === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3">
              <BigFigure value={o.money(o.stats.billed)} label="Billed" />
              <BigFigure value={o.money(o.stats.paid)} label="Paid" />
              <BigFigure value={o.money(o.stats.unpaid)} label="Unpaid" warn />
            </div>
            {o.stats.otherCurrencies.length > 0 && (
              <p className="-mt-3 text-[13px] text-tile-muted">
                Also billed:{' '}
                {o.stats.otherCurrencies
                  .map((c) => formatMoney(c.billed, c.currency, o.settings.locale))
                  .join(' · ')}{' '}
                (not included above)
              </p>
            )}
            <div className="flex gap-2">
              {duplicateLast && (
                <Button icon={Copy} onClick={duplicateLast}>
                  Duplicate last
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            <Stat label="Drafts" value={o.stats.counts.draft} />
            <Stat label="Sent" value={o.stats.counts.sent} />
            <Stat
              label="Overdue"
              value={
                <span className={o.stats.counts.overdue ? 'text-tile-danger' : undefined}>
                  {o.stats.counts.overdue}
                </span>
              }
              chip={o.stats.overdue ? <MiniChip>{o.compact(o.stats.overdue)}</MiniChip> : undefined}
            />
            <Stat label="Paid" value={o.stats.counts.paid} />
          </div>
        </div>
        <div className="flex w-[440px] shrink-0 flex-col gap-3.5 rounded-tile-lg bg-linear-to-b from-[#e9ecf1] to-[#dce1e8] p-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-tile-muted">Billed per month</span>
            <span className="text-xl font-bold tracking-[-0.4px]">{headline(o)}</span>
          </div>
          <Bars o={o} height={244} />
        </div>
      </section>

      <section aria-label="Invoices" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Filters o={o} filter={list.filter} onFilter={list.setFilter} surface="tile" />
          <SearchField
            value={list.query}
            onChange={list.setQuery}
            className="w-[280px] bg-tile-tile"
          />
        </div>
        {list.visible.length ? (
          <ul className="flex flex-col rounded-tile-lg border border-tile-border px-5 py-1">
            {list.visible.map((row) => (
              <DesktopRow key={row.invoice.id} row={row} o={o} menu={menu(row)} />
            ))}
          </ul>
        ) : (
          <NoMatches query={list.query} />
        )}
      </section>

      <LocalDataNotice o={o} />
      {dialogs}
    </div>
  )
}

function BigFigure({ value, label, warn }: { value: string; label: string; warn?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span
        className={cn(
          'truncate text-[28px] font-bold tracking-[-0.6px] tabular-nums',
          warn && 'text-tile-warning',
        )}
      >
        {value}
      </span>
      <span className="text-sm text-tile-muted">{label}</span>
    </div>
  )
}

function DesktopRow({ row, o, menu }: { row: InvoiceRow; o: Overview; menu: ReactNode }) {
  const { invoice, status } = row
  return (
    <li className="flex items-center gap-4 border-b border-tile-border py-2.5 last:border-b-0">
      <Link
        to={`/invoices/${invoice.id}`}
        className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_150px_110px_130px] items-center gap-4 rounded-md focus-visible:outline-2 focus-visible:outline-tile-accent"
      >
        <span className="flex min-w-0 items-center gap-3 py-1">
          <Avatar name={row.clientName} tone={avatarTone(status)} />
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-base font-bold tracking-[-0.2px]">{row.clientName}</span>
            <span className="text-[13px] text-tile-muted">{invoice.number}</span>
          </span>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] text-tile-muted">{status === 'paid' ? 'Paid' : 'Due'}</span>
          <span className={cn('text-[15px] font-bold', status === 'overdue' && 'text-tile-danger')}>
            {status === 'paid'
              ? invoice.paidAt
                ? o.date(invoice.paidAt)
                : '—'
              : o.date(invoice.dueDate)}
          </span>
        </span>
        <span>
          <StatusBadge status={status} />
        </span>
        <span className="text-right text-base font-bold tracking-[-0.2px] tabular-nums">
          {row.total}
        </span>
      </Link>
      {menu}
    </li>
  )
}

function LocalDataNotice({ o }: { o: Overview }) {
  return (
    <section
      aria-label="Saved on this device only"
      className="flex items-center gap-4 rounded-tile-lg bg-tile-tile py-4 pr-4 pl-[18px]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tile-panel text-tile-accent">
        <HardDrive size={19} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold">Saved on this device only</span>
        <span className="text-[13px] text-tile-muted">
          No account, no cloud. Export a backup now and then — clearing your browser data will
          remove your invoices.
          {o.settings.lastBackupAt &&
            ` Last backup ${timeAgo(o.settings.lastBackupAt).toLowerCase()}.`}
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        {/* Backup export / import arrive with phase 6. */}
        <Button variant="outline" icon={Upload} disabled title="Coming soon">
          Import
        </Button>
        <Button variant="dark" icon={Download} disabled title="Coming soon">
          Export backup
        </Button>
      </div>
    </section>
  )
}

function NoMatches({ query }: { query: string }) {
  return (
    <p className="rounded-tile-lg bg-tile-tile px-4 py-8 text-center text-sm text-tile-muted">
      {query ? `No invoices match “${query}”.` : 'No invoices here in this period.'}
    </p>
  )
}

/* ---------- mobile ---------- */

function MobileOverview({ o }: { o: Overview }) {
  const list = useListState(o)
  const { menu, dialogs } = useRowActions((iso) => o.date(iso))
  const [searching, setSearching] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const trend = o.stats.trend
  const shown =
    showAll || list.query || list.filter !== 'all' ? list.visible : list.visible.slice(0, 4)
  const round =
    'grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent'

  return (
    <div className="flex flex-col gap-[18px]">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-tile-muted">
            {o.settings.business.name || 'Tagy'}
          </p>
          <h1 className="text-[30px] leading-tight font-bold tracking-[-1.1px]">Overview</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Search invoices"
            aria-expanded={searching}
            onClick={() => {
              setSearching((s) => !s)
              list.setQuery('')
            }}
            className={cn(round, 'bg-tile-panel')}
          >
            <Search size={18} aria-hidden />
          </button>
          <Link
            to="/invoices/new"
            aria-label="New invoice"
            className={cn(round, 'bg-tile-fg text-white')}
          >
            <Plus size={20} aria-hidden />
          </Link>
        </div>
      </header>

      {searching && (
        <SearchField
          value={list.query}
          onChange={list.setQuery}
          className="bg-tile-panel"
          autoFocus
        />
      )}

      <section
        aria-label="Summary"
        className="flex flex-col gap-3 rounded-[20px] border border-tile-border bg-tile-panel p-4"
      >
        <div className="flex items-start justify-between gap-3 px-1 pt-1">
          <div className="flex flex-col gap-0.5">
            <Menu
              align="start"
              trigger={
                <button
                  type="button"
                  className="w-fit text-left text-[13px] text-tile-muted underline-offset-2 hover:underline"
                >
                  Billed · {PERIOD_LABELS[o.period].toLowerCase()}
                </button>
              }
            >
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <MenuItem
                  key={p}
                  icon={TrendingUp}
                  label={PERIOD_LABELS[p]}
                  selected={o.period === p}
                  onSelect={() => o.setPeriod(p)}
                />
              ))}
            </Menu>
            <span className="text-[32px] leading-tight font-bold tracking-[-1px] tabular-nums">
              {o.money(o.stats.billed)}
            </span>
          </div>
          {trend !== null && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-[9px] py-1 text-xs font-bold',
                trend >= 0
                  ? 'bg-tile-success-soft text-tile-success'
                  : 'bg-tile-danger-soft text-tile-danger',
              )}
              title="Compared with the previous period"
            >
              {trend >= 0 ? (
                <TrendingUp size={13} aria-hidden />
              ) : (
                <TrendingDown size={13} aria-hidden />
              )}
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="rounded-2xl bg-linear-to-b from-[#e9ecf1] to-[#dce1e8] px-3.5 pt-3.5 pb-2.5">
          <Bars o={o} height={108} compact />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Paid" value={o.money(o.stats.paid)} />
          <Stat
            label="Unpaid"
            value={<span className="text-tile-warning">{o.money(o.stats.unpaid)}</span>}
          />
        </div>
        {o.stats.counts.overdue > 0 && (
          <button
            type="button"
            onClick={() => list.setFilter('overdue')}
            className="flex items-center gap-2.5 rounded-tile-md bg-tile-danger-soft px-3 py-2.5 text-sm font-semibold text-tile-danger"
          >
            <CircleAlert size={17} aria-hidden />
            <span className="flex-1 text-left">
              {o.stats.counts.overdue} invoice{o.stats.counts.overdue === 1 ? '' : 's'} overdue ·{' '}
              {o.money(o.stats.overdue)}
            </span>
            <ChevronRight size={16} aria-hidden />
          </button>
        )}
      </section>

      <section aria-label="Invoices" className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold tracking-[-0.3px]">Recent invoices</h2>
          {list.visible.length > 4 && !list.query && list.filter === 'all' && (
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="text-sm font-semibold text-tile-accent"
            >
              {showAll ? 'Show less' : 'See all'}
            </button>
          )}
        </div>
        <Filters o={o} filter={list.filter} onFilter={list.setFilter} surface="panel" />
        {shown.length ? (
          <ul className="flex flex-col rounded-[18px] border border-tile-border bg-tile-panel px-3.5 py-0.5">
            {shown.map((row) => {
              const due = dueLine(row, o)
              return (
                <li
                  key={row.invoice.id}
                  className="flex items-center gap-2 border-b border-tile-border last:border-b-0"
                >
                  <Link
                    to={`/invoices/${row.invoice.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-tile-accent"
                  >
                    <Avatar
                      name={row.clientName}
                      tone={avatarTone(row.status)}
                      className="size-[38px]"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-bold">{row.clientName}</span>
                      <span
                        className={cn(
                          'truncate text-xs',
                          due.late ? 'text-tile-danger' : 'text-tile-muted',
                        )}
                      >
                        {row.invoice.number} · {due.text}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-[5px]">
                      <span className="text-[15px] font-bold tabular-nums">{row.total}</span>
                      <StatusBadge status={row.status} size="sm" />
                    </span>
                  </Link>
                  <div className="shrink-0 [&_button]:size-8">{menu(row)}</div>
                </li>
              )
            })}
          </ul>
        ) : (
          <NoMatches query={list.query} />
        )}
      </section>

      <section
        aria-label="Saved on this device"
        className="flex items-center gap-3 rounded-[18px] border border-tile-border bg-tile-panel px-4 py-3"
      >
        <HardDrive size={18} className="shrink-0 text-tile-accent" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-sm font-bold">Saved on this device</span>
          <span className="text-xs text-tile-muted">
            {o.settings.lastBackupAt
              ? `Last backup ${timeAgo(o.settings.lastBackupAt).toLowerCase()}`
              : 'Not backed up yet'}
          </span>
        </div>
        {/* Backup export arrives with phase 6. */}
        <Button variant="dark" icon={Download} disabled className="py-2 text-[13px]">
          Back up
        </Button>
      </section>
      {dialogs}
    </div>
  )
}
