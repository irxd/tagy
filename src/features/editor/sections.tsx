import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  History,
  Landmark,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useInvoices } from '@/db/hooks'
import { isNumberTaken } from '@/db/invoices'
import type { LineItem, PaymentTerms } from '@/db/types'
import { dueDateFor } from '@/domain/dates'
import { newLineItem, recentItems } from '@/domain/items'
import { termOptions } from '@/features/settings/options'
import { Button } from '@/ui/Button'
import { cn } from '@/ui/cn'
import { MiniChip } from '@/ui/Chip'
import { Stat } from '@/ui/Data'
import { DateField, SelectField, TextAreaField, TextField } from '@/ui/Field'
import { Menu, MenuItem } from '@/ui/Menu'
import { Checkbox, Toggle } from '@/ui/Toggle'
import { DecimalInput, MoneyInput } from './inputs'
import { useEditor } from './useEditor'

/** Card frame used by the editor's Items, Summary, Notes and Payment details. */
export function Card({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-tile-lg border border-tile-border bg-tile-panel p-5',
        className,
      )}
    >
      <header className="flex min-h-7 items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-[-0.3px]">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function Hint({ icon: Icon, children }: { icon: typeof Eye; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-tile-tile py-1.5 pr-3 pl-2.5 text-[13px] font-semibold text-tile-muted">
      <Icon size={14} aria-hidden />
      {children}
    </span>
  )
}

/** Details: number, dates, currency, terms, tax, discount, reference. */
export function DetailsFields({ columns = 4 }: { columns?: 2 | 4 }) {
  const { invoice, settings, set, date } = useEditor()
  const [number, setNumber] = useState<string | null>(null)
  const [numberError, setNumberError] = useState<string | null>(null)

  async function changeNumber(value: string) {
    setNumber(value)
    const trimmed = value.trim()
    if (!trimmed) return setNumberError('Add an invoice number')
    if (await isNumberTaken(trimmed, invoice.id))
      return setNumberError(`${trimmed} is already used`)
    setNumberError(null)
    set({ number: trimmed })
  }

  const taxOptions = [
    { value: '', label: 'No tax' },
    ...settings.taxRates.map((t) => ({ value: t.id, label: `${t.name} · ${t.pct}%` })),
    // Keep a frozen rate visible even if it was removed from Settings since.
    ...(invoice.taxSnapshot && !settings.taxRates.some((t) => t.id === invoice.taxRateId)
      ? [
          {
            value: invoice.taxRateId ?? '',
            label: `${invoice.taxSnapshot.name} · ${invoice.taxSnapshot.pct}%`,
          },
        ]
      : []),
  ]

  return (
    <div className={cn('grid gap-2.5', columns === 4 ? 'grid-cols-4' : 'grid-cols-2')}>
      <TextField
        label="Invoice no."
        value={number ?? invoice.number}
        error={numberError ?? undefined}
        onChange={(e) => void changeNumber(e.target.value)}
        onBlur={() => {
          if (!numberError) setNumber(null)
        }}
      />
      <DateField
        label="Issue date"
        display={date(invoice.issueDate)}
        value={invoice.issueDate}
        onChange={(e) =>
          e.target.value &&
          set({ issueDate: e.target.value, dueDate: dueDateFor(e.target.value, invoice.terms) })
        }
      />
      <DateField
        label="Due date"
        display={date(invoice.dueDate)}
        value={invoice.dueDate}
        min={invoice.issueDate}
        onChange={(e) => e.target.value && set({ dueDate: e.target.value })}
      />
      <SelectField
        label="Currency"
        value={invoice.currency}
        options={Intl.supportedValuesOf('currency').map((c) => ({ value: c, label: c }))}
        onChange={(e) => set({ currency: e.target.value })}
      />
      <SelectField
        label="Terms"
        value={invoice.terms}
        options={termOptions}
        onChange={(e) => {
          const terms = e.target.value as PaymentTerms
          set({ terms, dueDate: dueDateFor(invoice.issueDate, terms) })
        }}
      />
      <SelectField
        label="Tax"
        value={invoice.taxRateId ?? ''}
        options={taxOptions}
        onChange={(e) => set({ taxRateId: e.target.value || null, applyTax: !!e.target.value })}
      />
      <PercentField
        label="Discount"
        value={invoice.discountPct}
        onValue={(discountPct) => set({ discountPct })}
      />
      <TextField
        label="Reference / PO"
        placeholder="Optional"
        value={invoice.reference}
        onChange={(e) => set({ reference: e.target.value })}
      />
    </div>
  )
}

function PercentField({
  label,
  value,
  onValue,
}: {
  label: string
  value: number
  onValue: (n: number) => void
}) {
  return (
    <label className="group flex flex-col gap-[3px] rounded-tile-md border-[1.5px] border-transparent bg-tile-tile px-3.5 pt-2.5 pb-[11px] focus-within:border-tile-accent focus-within:bg-tile-panel">
      <span className="text-[13px] text-tile-muted group-focus-within:text-tile-accent">
        {label}
      </span>
      <span className="flex items-baseline text-[15px] font-bold">
        <DecimalInput
          aria-label={label}
          value={value}
          max={100}
          onValue={onValue}
          className="w-full min-w-0 bg-transparent outline-none"
        />
        <span className="text-tile-muted">%</span>
      </span>
    </label>
  )
}

/** Items: editable line rows with quantity, rate and amount; add, reorder, remove. */
export function ItemsCard({ className }: { className?: string }) {
  const { invoice, set, totals, money } = useEditor()
  const invoices = useInvoices()
  const recent = invoices ? recentItems(invoices, invoice.id) : []
  const [focusId, setFocusId] = useState<string | null>(null)
  const items = invoice.items

  function update(id: string, patch: Partial<LineItem>) {
    set({ items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)) })
  }
  function add(patch: Partial<LineItem> = {}) {
    const item = newLineItem(patch)
    set({ items: [...items, item] })
    setFocusId(item.id)
  }
  function move(index: number, by: -1 | 1) {
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item!)
    set({ items: next })
  }

  return (
    <Card
      title={`Items · ${items.length}`}
      className={className}
      action={
        <div className="flex gap-2">
          {recent.length > 0 && (
            <Menu
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-tile-tile py-1.5 pr-3 pl-2.5 text-[13px] font-semibold text-tile-muted hover:bg-tile-tile-strong focus-visible:outline-2 focus-visible:outline-tile-accent"
                >
                  <History size={14} aria-hidden />
                  Recent items
                </button>
              }
            >
              {recent.map((r) => (
                <MenuItem
                  key={r.id}
                  icon={Plus}
                  label={r.title}
                  description={money(r.rate)}
                  onSelect={() => add({ title: r.title, description: r.description, rate: r.rate })}
                />
              ))}
            </Menu>
          )}
          <Button icon={Plus} onClick={() => add()}>
            Add item
          </Button>
        </div>
      }
    >
      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => add()}
          className="rounded-tile-md border border-dashed border-tile-border-strong px-4 py-6 text-sm text-tile-muted hover:bg-tile-tile"
        >
          No items yet — add what you're billing for.
        </button>
      ) : (
        <ol className="flex flex-col">
          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              index={i}
              count={items.length}
              amount={money(totals.lines[i] ?? 0)}
              autoFocus={focusId === item.id}
              onChange={(patch) => update(item.id, patch)}
              onMove={(by) => move(i, by)}
              onRemove={() => set({ items: items.filter((x) => x.id !== item.id) })}
            />
          ))}
        </ol>
      )}
    </Card>
  )
}

function ItemRow({
  item,
  index,
  count,
  amount,
  autoFocus,
  onChange,
  onMove,
  onRemove,
}: {
  item: LineItem
  index: number
  count: number
  amount: string
  autoFocus: boolean
  onChange: (patch: Partial<LineItem>) => void
  onMove: (by: -1 | 1) => void
  onRemove: () => void
}) {
  const { invoice, money } = useEditor()
  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) titleRef.current?.focus()
  }, [autoFocus])
  const n = index + 1
  const iconButton =
    'grid size-7 place-items-center rounded-full text-tile-muted hover:bg-tile-tile hover:text-tile-fg disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-tile-accent'

  return (
    <li className="group flex items-center gap-3.5 border-b border-tile-border py-3.5 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <input
          ref={titleRef}
          aria-label={`Item ${n} name`}
          placeholder="Item name"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full min-w-0 bg-transparent text-[15px] font-bold outline-none placeholder:font-semibold placeholder:text-tile-subtle"
        />
        <input
          aria-label={`Item ${n} description`}
          placeholder="Description (optional)"
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full min-w-0 bg-transparent text-[13px] text-tile-muted outline-none placeholder:text-tile-subtle"
        />
      </div>
      <label className="flex shrink-0 items-center gap-1 rounded-full bg-tile-tile px-2.5 py-[5px] text-[13px] focus-within:outline-2 focus-within:outline-tile-accent">
        <span className="text-tile-muted" aria-hidden>
          ×
        </span>
        <DecimalInput
          aria-label={`Item ${n} quantity`}
          value={item.qty}
          onValue={(qty) => onChange({ qty })}
          className="w-[4ch] bg-transparent font-bold outline-none"
        />
      </label>
      <MoneyInput
        aria-label={`Item ${n} rate`}
        value={item.rate}
        currency={invoice.currency}
        format={money}
        onValue={(rate) => onChange({ rate })}
        className="w-[96px] shrink-0 rounded-md bg-transparent text-right text-sm text-tile-muted outline-none focus:bg-tile-tile focus:text-tile-fg"
      />
      <span className="w-[104px] shrink-0 text-right text-[15px] font-bold tabular-nums">
        {amount}
      </span>
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Move item ${n} up`}
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className={iconButton}
        >
          <ArrowUp size={14} aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Move item ${n} down`}
          disabled={index === count - 1}
          onClick={() => onMove(1)}
          className={iconButton}
        >
          <ArrowDown size={14} aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Remove item ${n}`}
          onClick={onRemove}
          className={iconButton}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </li>
  )
}

/** Summary: subtotal, discount, tax, the dark total tile and the two invoice toggles. */
export function SummaryCard({ className }: { className?: string }) {
  const { invoice, totals, money, taxPct, set, settings } = useEditor()
  const rate = taxPct ?? settings.taxRates.find((t) => t.id === invoice.taxRateId)?.pct
  return (
    <Card title="Summary" className={className}>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Subtotal" value={money(totals.subtotal)} />
        <Stat
          label="Discount"
          value={totals.discount ? `−${money(totals.discount)}` : money(0)}
          chip={invoice.discountPct ? <MiniChip>{invoice.discountPct}%</MiniChip> : undefined}
        />
        <Stat
          label="Tax"
          value={money(totals.tax)}
          chip={taxPct ? <MiniChip>{taxPct}%</MiniChip> : undefined}
        />
      </div>
      <div className="flex items-end justify-between rounded-tile-md bg-tile-fg px-4 py-3.5 text-white">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-white/60">Total due</span>
          <span className="text-2xl font-bold tracking-[-0.6px] tabular-nums">
            {money(totals.total)}
          </span>
        </div>
        <span className="text-[13px] font-semibold text-white/60">{invoice.currency}</span>
      </div>
      <div className="flex flex-col gap-3 px-0.5 pt-1">
        <Toggle
          checked={invoice.applyTax}
          disabled={!invoice.taxRateId}
          onCheckedChange={(applyTax) => set({ applyTax })}
        >
          {rate ? `Apply tax (${rate}%)` : 'Apply tax'}
        </Toggle>
        <Checkbox
          checked={invoice.showPaymentDetails}
          onCheckedChange={(showPaymentDetails) => set({ showPaymentDetails })}
        >
          Show payment details
        </Checkbox>
      </div>
    </Card>
  )
}

export function NotesCard({ className }: { className?: string }) {
  const { invoice, set } = useEditor()
  return (
    <Card title="Notes" className={className} action={<Hint icon={Eye}>On invoice</Hint>}>
      <TextAreaField
        label="Notes"
        className="[&_label]:sr-only"
        rows={2}
        placeholder="e.g. Thank you for your business!"
        value={invoice.notes}
        onChange={(e) => set({ notes: e.target.value })}
      />
    </Card>
  )
}

export function PaymentCard({ className }: { className?: string }) {
  const { invoice, settings, set } = useEditor()
  const fromSettings = settings.business.paymentDetails
  const changed = invoice.paymentDetails !== fromSettings && fromSettings !== ''
  return (
    <Card
      title="Payment details"
      className={className}
      action={
        !invoice.showPaymentDetails ? (
          <Hint icon={EyeOff}>Hidden on invoice</Hint>
        ) : changed ? (
          <button
            type="button"
            onClick={() => set({ paymentDetails: fromSettings })}
            className="inline-flex items-center gap-1.5 rounded-full bg-tile-tile py-1.5 pr-3 pl-2.5 text-[13px] font-semibold text-tile-muted hover:bg-tile-tile-strong focus-visible:outline-2 focus-visible:outline-tile-accent"
          >
            <RotateCcw size={14} aria-hidden />
            Use settings
          </button>
        ) : (
          <Hint icon={Landmark}>From settings</Hint>
        )
      }
    >
      <TextAreaField
        label="Payment details"
        className="[&_label]:sr-only"
        rows={3}
        placeholder="How should the client pay you? Add a default in Settings."
        value={invoice.paymentDetails}
        onChange={(e) => set({ paymentDetails: e.target.value })}
      />
    </Card>
  )
}
