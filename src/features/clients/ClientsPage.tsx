import { Plus, Search, UserPlus, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { matchesClient } from '@/domain/clients'
import { formatMoney } from '@/domain/money'
import { Button, IconButton } from '@/ui/Button'
import { FilterPill } from '@/ui/Chip'
import { cn } from '@/ui/cn'
import { Overlay } from '@/ui/Overlay'
import { PageHeader } from '@/ui/PageHeader'
import { useLayout } from '@/ui/useLayout'
import { ClientForm } from './ClientForm'
import { ClientCard, ClientListRow } from './ClientViews'
import { EmptyClients } from './EmptyClients'
import { filterRows, useClientRows, type ClientFilter, type ClientRow } from './useClientRows'

const FILTERS: { key: ClientFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'With unpaid' },
  { key: 'archived', label: 'Archived' },
]

/**
 * Clients. The open form lives in the URL (`?client=new` or `?client=<id>`)
 * so Back closes it, on mobile especially.
 */
export function ClientsPage() {
  const data = useClientRows()
  const layout = useLayout()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<ClientFilter>('all')
  const [query, setQuery] = useState('')

  const open = params.get('client')
  const openForm = (id: string) => setParams({ client: id })
  const closeForm = () => setParams({}, { replace: layout === 'desktop' })

  if (!data) return null
  const { rows, settings } = data
  const editing = open && open !== 'new' ? rows.find((r) => r.client.id === open) : undefined
  const formOpen = open === 'new' || !!editing
  const visible = filterRows(rows, filter).filter((r) => matchesClient(r.client, query))
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, filterRows(rows, f.key).length]))
  const empty = rows.length === 0

  const form = formOpen && (
    <ClientForm
      // Remount when switching clients so the form takes the new values.
      key={open}
      client={editing?.client}
      invoiceCount={editing?.stats.invoiceCount}
      defaultCurrency={settings.currency}
      defaultTerms={settings.terms}
      onDone={closeForm}
    />
  )
  const formTitle = editing ? 'Edit client' : 'New client'

  const filters = (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 desk:mx-0 desk:px-0">
      {FILTERS.map((f) => (
        <FilterPill
          key={f.key}
          active={filter === f.key}
          count={counts[f.key]}
          onClick={() => setFilter(f.key)}
          surface={layout === 'mobile' ? 'panel' : 'tile'}
        >
          {f.label}
        </FilterPill>
      ))}
    </div>
  )

  if (layout === 'desktop') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Clients"
          subtitle="People and businesses you invoice"
          actions={
            <Button variant="dark" icon={Plus} onClick={() => openForm('new')}>
              New client
            </Button>
          }
        />
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {empty ? (
              <EmptyClients mobile={false} onAdd={() => openForm('new')} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  {filters}
                  <SearchField value={query} onChange={setQuery} />
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
                  {visible.map((row) => (
                    <ClientCard
                      key={row.client.id}
                      row={row}
                      locale={settings.locale}
                      selected={row.client.id === open}
                      onOpen={() => openForm(row.client.id)}
                    />
                  ))}
                </div>
                {visible.length === 0 && <NoMatches query={query} />}
              </>
            )}
          </div>
          {formOpen && (
            <aside
              aria-label={formTitle}
              className="sticky top-5 flex w-[400px] shrink-0 flex-col gap-3.5 rounded-tile-lg border border-tile-border p-5"
            >
              <header className="flex items-center justify-between pb-1">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold tracking-[-0.3px]">{formTitle}</h2>
                  <p className="text-[13px] text-tile-muted">Saved to this browser</p>
                </div>
                <IconButton icon={X} label="Close" onClick={closeForm} />
              </header>
              {form}
            </aside>
          )}
        </div>
      </div>
    )
  }

  return (
    <MobileClients
      rows={rows}
      visible={visible}
      empty={empty}
      filters={filters}
      query={query}
      onQuery={setQuery}
      currency={settings.currency}
      locale={settings.locale}
      onOpen={openForm}
      form={
        <Overlay
          open={formOpen}
          onOpenChange={(o) => !o && closeForm()}
          title={formTitle}
          description="Saved to this browser"
        >
          {form}
        </Overlay>
      }
    />
  )
}

function MobileClients({
  rows,
  visible,
  empty,
  filters,
  query,
  onQuery,
  currency,
  locale,
  onOpen,
  form,
}: {
  rows: ClientRow[]
  visible: ClientRow[]
  empty: boolean
  filters: ReactNode
  query: string
  onQuery: (q: string) => void
  currency: string
  locale: string
  onOpen: (id: string) => void
  form: ReactNode
}) {
  const [searching, setSearching] = useState(false)
  const active = rows.filter((r) => !r.client.archived)
  // Summary only adds up clients billed in the default currency (decision 7).
  const same = active.filter((r) => r.currency === currency)
  const unpaid = same.filter((r) => r.stats.unpaid > 0)
  const roundIcon =
    'grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent'

  return (
    <div className="flex flex-col gap-[18px]">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-tile-muted">
            {active.length} client{active.length === 1 ? '' : 's'}
          </p>
          <h1 className="text-[30px] leading-tight font-bold tracking-[-1.1px]">Clients</h1>
        </div>
        <div className="flex gap-2">
          {!empty && (
            <button
              type="button"
              aria-label="Search clients"
              aria-expanded={searching}
              onClick={() => {
                setSearching((s) => !s)
                onQuery('')
              }}
              className={cn(roundIcon, 'bg-tile-panel text-tile-fg')}
            >
              <Search size={18} aria-hidden />
            </button>
          )}
          <button
            type="button"
            aria-label="New client"
            onClick={() => onOpen('new')}
            className={cn(roundIcon, 'bg-tile-fg text-white')}
          >
            <UserPlus size={19} aria-hidden />
          </button>
        </div>
      </header>

      {empty ? (
        <EmptyClients mobile onAdd={() => onOpen('new')} />
      ) : (
        <>
          {searching && <SearchField value={query} onChange={onQuery} autoFocus wide />}
          <div className="grid grid-cols-2 gap-2">
            <SummaryTile
              label={`Unpaid · ${unpaid.length} client${unpaid.length === 1 ? '' : 's'}`}
              value={formatMoney(
                unpaid.reduce((s, r) => s + r.stats.unpaid, 0),
                currency,
                locale,
              )}
              warn
            />
            <SummaryTile
              label="Total billed"
              value={formatMoney(
                same.reduce((s, r) => s + r.stats.billed, 0),
                currency,
                locale,
              )}
            />
          </div>
          {filters}
          {visible.length > 0 ? (
            <ul className="flex flex-col rounded-[18px] border border-tile-border bg-tile-panel px-3.5 py-0.5">
              {visible.map((row) => (
                <ClientListRow
                  key={row.client.id}
                  row={row}
                  locale={locale}
                  onOpen={() => onOpen(row.client.id)}
                />
              ))}
            </ul>
          ) : (
            <NoMatches query={query} />
          )}
        </>
      )}
      {form}
    </div>
  )
}

function SummaryTile({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-tile-md border border-tile-border bg-tile-panel pt-2.5 pr-2.5 pb-3 pl-3">
      <span className="truncate text-[13px] text-tile-muted">{label}</span>
      <span
        className={cn(
          'truncate text-[17px] font-bold tabular-nums',
          warn ? 'text-tile-warning' : 'text-tile-fg',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function SearchField({
  value,
  onChange,
  autoFocus,
  wide,
}: {
  value: string
  onChange: (q: string) => void
  autoFocus?: boolean
  wide?: boolean
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 rounded-full px-3.5 py-[9px] focus-within:outline-2 focus-within:outline-tile-accent',
        wide ? 'w-full bg-tile-panel' : 'w-[220px] bg-tile-tile',
      )}
    >
      <Search size={15} className="shrink-0 text-tile-muted" aria-hidden />
      <input
        type="search"
        aria-label="Search clients"
        placeholder="Search clients"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-tile-subtle"
      />
    </label>
  )
}

function NoMatches({ query }: { query: string }) {
  return (
    <p className="rounded-tile-lg bg-tile-tile px-4 py-8 text-center text-sm text-tile-muted">
      {query ? `No clients match “${query}”.` : 'Nothing here yet.'}
    </p>
  )
}
