import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  Check,
  ChevronRight,
  CircleCheck,
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  HardDriveDownload,
  History,
  List,
  Maximize2,
  Minus,
  Plus,
  Search,
  Send,
  Settings2,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { createClient } from '@/db/clients'
import { useClients, useInvoices } from '@/db/hooks'
import { deleteInvoice, duplicateInvoice, isNumberTaken, restoreInvoice } from '@/db/invoices'
import { updateSettings } from '@/db/settings'
import type { Accent, Client, LineItem, PaymentTerms, TemplateId } from '@/db/types'
import { dueDateFor, formatDate, TERM_LABELS, todayISO } from '@/domain/dates'
import { matchesClient } from '@/domain/clients'
import { newLineItem, recentItems } from '@/domain/items'
import { ClientForm } from '@/features/clients/ClientForm'
import { TEMPLATE_LABELS } from '@/features/settings/options'
import { ACCENTS, PAGE_WIDTH } from '@/templates/view'
import { Button } from '@/ui/Button'
import { MiniChip } from '@/ui/Chip'
import { cn } from '@/ui/cn'
import { Avatar } from '@/ui/Data'
import { DateField, SelectField, TextField } from '@/ui/Field'
import { Menu, MenuItem } from '@/ui/Menu'
import { ConfirmDialog, Overlay } from '@/ui/Overlay'
import { StatusBadge } from '@/ui/Status'
import { useToast } from '@/ui/toastContext'
import { Toggle } from '@/ui/Toggle'
import { DecimalInput, MoneyInput } from './inputs'
import { PreviewDialog, ScaledPage } from './preview'
import { useEditor } from './useEditor'
import { useInvoiceView } from './useInvoiceView'
import { useDownloadPdf } from './useDownloadPdf'
import { useStatusChange } from './useStatusChange'

const STEPS = ['client', 'details', 'items', 'review'] as const
type Step = (typeof STEPS)[number]
const STEP_LABELS: Record<Step, string> = {
  client: 'Client',
  details: 'Details',
  items: 'Items',
  review: 'Review',
}

/**
 * Mobile · Editor 1–4. The step lives in the URL (`?step=`) so the phone's
 * Back button walks back through the flow. Opening an existing invoice lands
 * on Review.
 */
export function MobileEditor() {
  const { invoice } = useEditor()
  const [params, setParams] = useSearchParams()
  const [previewOpen, setPreviewOpen] = useState(false)
  const view = useInvoiceView()
  const navigate = useNavigate()
  const raw = params.get('step')
  const step: Step = STEPS.includes(raw as Step) ? (raw as Step) : 'review'
  const go = (to: Step) => setParams({ step: to })
  const next = STEPS[STEPS.indexOf(step) + 1]

  return (
    <div className="flex min-h-[calc(100dvh-24px)] flex-col">
      <div className="flex flex-1 flex-col gap-5 pb-6">
        <FlowHeader
          step={step}
          onStep={go}
          onClose={() => navigate('/')}
          onPreview={() => setPreviewOpen(true)}
        />
        {step === 'client' && <ClientStep />}
        {step === 'details' && <DetailsStep />}
        {step === 'items' && <ItemsStep />}
        {step === 'review' && <ReviewStep onStep={go} onPreview={() => setPreviewOpen(true)} />}
      </div>
      <ActionBar step={step} onNext={next ? () => go(next) : undefined} />
      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} view={view} />
      <span className="sr-only" aria-live="polite">
        Step {STEPS.indexOf(step) + 1} of 4: {STEP_LABELS[step]}, {invoice.number}
      </span>
    </div>
  )
}

function FlowHeader({
  step,
  onStep,
  onClose,
  onPreview,
}: {
  step: Step
  onStep: (s: Step) => void
  onClose: () => void
  onPreview: () => void
}) {
  const { invoice, client, status } = useEditor()
  const current = STEPS.indexOf(step)
  const round =
    'grid size-10 place-items-center rounded-full bg-tile-panel text-tile-fg focus-visible:outline-2 focus-visible:outline-tile-accent'
  const name = invoice.clientSnapshot?.name ?? client?.name
  return (
    <header className="flex flex-col gap-4">
      <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
        <button type="button" aria-label="Close" onClick={onClose} className={round}>
          <X size={18} aria-hidden />
        </button>
        <div className="flex min-w-0 flex-col items-center gap-px text-center">
          <h1 className="truncate text-[17px] font-bold tracking-[-0.3px]">
            {invoice.status === 'draft' ? 'New invoice' : invoice.number}
          </h1>
          <p className="truncate text-xs text-tile-muted">
            {invoice.status === 'draft'
              ? `${invoice.number} · Draft`
              : [
                  name,
                  status === 'overdue' ? 'Overdue' : invoice.status === 'paid' ? 'Paid' : 'Sent',
                ]
                  .filter(Boolean)
                  .join(' · ')}
          </p>
        </div>
        <button type="button" aria-label="Preview" onClick={onPreview} className={round}>
          <Eye size={18} aria-hidden />
        </button>
      </div>
      <nav aria-label="Invoice steps">
        <ol className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <button
                type="button"
                aria-current={s === step ? 'step' : undefined}
                onClick={() => onStep(s)}
                className="flex w-full flex-col gap-1.5 text-left focus-visible:outline-2 focus-visible:outline-tile-accent"
              >
                <span
                  className={cn(
                    'h-1 rounded-sm',
                    i === current
                      ? 'bg-tile-accent'
                      : i < current
                        ? 'bg-tile-fg'
                        : 'bg-tile-tile-strong',
                  )}
                />
                <span
                  className={cn(
                    'text-[11px]',
                    i <= current ? 'font-bold text-tile-fg' : 'font-medium text-tile-subtle',
                  )}
                >
                  {i + 1} {STEP_LABELS[s]}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}

function Heading({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-1 pt-1">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-[-0.5px]">{title}</h2>
        <p className="text-sm text-tile-muted">{sub}</p>
      </div>
      {action}
    </div>
  )
}

/* ---------- 1 · Client ---------- */

function ClientStep() {
  const { invoice, settings, set } = useEditor()
  const clients = useClients()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const matches = (clients ?? []).filter((c) => matchesClient(c, query))
  const name = query.trim()
  const exact = clients?.some((c) => c.name.toLowerCase() === name.toLowerCase())

  function choose(client: Client) {
    if (invoice.status !== 'draft') return set({ clientId: client.id })
    const terms = client.terms ?? settings.terms
    set({
      clientId: client.id,
      currency: client.currency ?? settings.currency,
      terms,
      dueDate: dueDateFor(invoice.issueDate, terms),
    })
  }

  return (
    <>
      <Heading title="Who is this invoice for?" sub="Pick a saved client or add a new one." />
      <label className="flex h-12 items-center gap-2.5 rounded-full border border-tile-border bg-tile-panel px-4 focus-within:outline-2 focus-within:outline-tile-accent">
        <Search size={17} className="shrink-0 text-tile-muted" aria-hidden />
        <input
          type="search"
          aria-label="Search or type a new client"
          placeholder="Search or type a new client"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-tile-subtle"
        />
      </label>
      <section className="flex flex-col gap-2" aria-label="Clients">
        <h3 className="text-[13px] font-semibold text-tile-muted">
          {query ? 'Matches' : 'Recent clients'}
        </h3>
        <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Bill to">
          {matches.map((c) => {
            const selected = c.id === invoice.clientId
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(c)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border py-3 pr-3.5 pl-3 text-left focus-visible:outline-2 focus-visible:outline-tile-accent',
                    selected
                      ? 'border-tile-accent bg-tile-panel'
                      : 'border-transparent bg-tile-tile',
                  )}
                >
                  <Avatar name={c.name} tone={selected ? 'ink' : 'light'} className="size-10" />
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="truncate text-[15px] font-bold">{c.name}</span>
                    <span className="truncate text-xs text-tile-muted">
                      {c.email || c.contact || 'No email'}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'grid size-[22px] shrink-0 place-items-center rounded-full',
                      selected
                        ? 'bg-tile-accent text-white'
                        : 'border border-tile-border-strong bg-tile-panel',
                    )}
                  >
                    {selected && <Check size={13} strokeWidth={3} aria-hidden />}
                  </span>
                </button>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={async () => {
                if (name && !exact) {
                  const created = await createClient({ name })
                  toast({ message: `${created.name} saved as a client` })
                  choose(created)
                  setQuery('')
                } else {
                  setFormOpen(true)
                }
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-tile-border-strong py-3 pr-3.5 pl-3 text-left focus-visible:outline-2 focus-visible:outline-tile-accent"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tile-accent-soft text-tile-accent">
                <Plus size={18} aria-hidden />
              </span>
              <span className="text-[15px] font-bold text-tile-accent">
                {name && !exact ? `Add “${name}”` : 'New client'}
              </span>
            </button>
          </li>
        </ul>
      </section>
      <div className="flex items-center gap-3 rounded-2xl border border-tile-border bg-tile-panel px-3.5 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-tile-muted">From</span>
          <span className="truncate text-sm font-semibold">
            {[settings.business.name || 'Your business', settings.business.email]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        <Link to="/settings/business" className="text-sm font-semibold text-tile-accent-ink">
          Edit
        </Link>
      </div>
      <Overlay
        open={formOpen}
        onOpenChange={setFormOpen}
        title="New client"
        description="Saved to this browser"
      >
        <ClientForm
          defaultCurrency={settings.currency}
          defaultTerms={settings.terms}
          onDone={(saved) => {
            if (saved) choose(saved)
            setFormOpen(false)
          }}
        />
      </Overlay>
    </>
  )
}

/* ---------- 2 · Details ---------- */

function DetailsStep() {
  const { invoice, settings, set, date } = useEditor()
  const [numberError, setNumberError] = useState<string | null>(null)
  const [number, setNumber] = useState<string | null>(null)

  async function changeNumber(value: string) {
    setNumber(value)
    const trimmed = value.trim()
    if (!trimmed) return setNumberError('Add an invoice number')
    if (await isNumberTaken(trimmed, invoice.id))
      return setNumberError(`${trimmed} is already used`)
    setNumberError(null)
    set({ number: trimmed })
  }

  return (
    <>
      <Heading title="Invoice details" sub="Prefilled from your defaults — change anything." />
      <div className="flex flex-col gap-2 rounded-[20px] border border-tile-border bg-tile-panel p-2">
        <TextField
          label="Invoice number"
          value={number ?? invoice.number}
          error={numberError ?? undefined}
          onChange={(e) => void changeNumber(e.target.value)}
          onBlur={() => !numberError && setNumber(null)}
        />
        <div className="grid grid-cols-2 gap-2">
          <DateField
            label="Issued"
            display={date(invoice.issueDate)}
            value={invoice.issueDate}
            onChange={(e) =>
              e.target.value &&
              set({ issueDate: e.target.value, dueDate: dueDateFor(e.target.value, invoice.terms) })
            }
          />
          <DateField
            label="Due"
            display={date(invoice.dueDate)}
            value={invoice.dueDate}
            min={invoice.issueDate}
            onChange={(e) => e.target.value && set({ dueDate: e.target.value })}
          />
        </div>
        <fieldset className="flex flex-col gap-2.5 rounded-tile-md bg-tile-tile px-3.5 pt-3 pb-3.5">
          <legend className="contents">
            <span className="flex justify-between text-[13px] text-tile-muted">
              Payment terms <span className="text-xs text-tile-subtle">Sets the due date</span>
            </span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TERM_LABELS) as PaymentTerms[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={invoice.terms === t}
                onClick={() => set({ terms: t, dueDate: dueDateFor(invoice.issueDate, t) })}
                className={cn(
                  'rounded-full px-[13px] py-2 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-tile-accent',
                  invoice.terms === t ? 'bg-tile-fg text-white' : 'bg-tile-panel text-tile-fg',
                )}
              >
                {TERM_LABELS[t]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Currency"
            value={invoice.currency}
            options={Intl.supportedValuesOf('currency').map((c) => ({ value: c, label: c }))}
            onChange={(e) => set({ currency: e.target.value })}
          />
          <SelectField
            label="Tax"
            value={invoice.taxRateId ?? ''}
            options={[
              { value: '', label: 'No tax' },
              ...settings.taxRates.map((t) => ({ value: t.id, label: `${t.name} ${t.pct}%` })),
            ]}
            onChange={(e) => set({ taxRateId: e.target.value || null, applyTax: !!e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <TextField
            label="Reference / PO"
            placeholder="Optional"
            value={invoice.reference}
            onChange={(e) => set({ reference: e.target.value })}
          />
          <label className="group flex flex-col gap-[3px] rounded-tile-md border-[1.5px] border-transparent bg-tile-tile px-3.5 pt-2.5 pb-[11px] focus-within:border-tile-accent focus-within:bg-tile-panel">
            <span className="text-[13px] text-tile-muted group-focus-within:text-tile-accent">
              Discount
            </span>
            <span className="flex items-baseline text-[15px] font-bold">
              <DecimalInput
                aria-label="Discount"
                value={invoice.discountPct}
                max={100}
                onValue={(discountPct) => set({ discountPct })}
                className="w-full min-w-0 bg-transparent outline-none"
              />
              <span className="text-tile-muted">%</span>
            </span>
          </label>
        </div>
      </div>
      <p className="flex items-center gap-2.5 px-1.5 text-xs text-tile-muted">
        <Settings2 size={15} aria-hidden />
        Change defaults anytime in Settings → Invoice defaults
      </p>
    </>
  )
}

/* ---------- 3 · Items ---------- */

function ItemsStep() {
  const { invoice, set, totals, money, taxPct } = useEditor()
  const invoices = useInvoices()
  const recent = invoices ? recentItems(invoices, invoice.id) : []
  const items = invoice.items

  const update = (id: string, patch: Partial<LineItem>) =>
    set({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  const add = (patch: Partial<LineItem> = {}) => set({ items: [...items, newLineItem(patch)] })
  const move = (index: number, by: -1 | 1) => {
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item!)
    set({ items: next })
  }

  return (
    <>
      <Heading
        title="Items"
        sub={`${items.length} item${items.length === 1 ? '' : 's'}`}
        action={
          recent.length > 0 && (
            <Menu
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-tile-panel py-1.5 pr-3 pl-2.5 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-tile-accent"
                >
                  <History size={14} className="text-tile-muted" aria-hidden />
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
          )
        }
      />
      <ol className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="flex flex-col gap-2.5 rounded-[18px] border border-tile-border bg-tile-panel p-3.5"
          >
            <div className="flex gap-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <input
                  aria-label={`Item ${i + 1} name`}
                  placeholder="Item name"
                  value={item.title}
                  onChange={(e) => update(item.id, { title: e.target.value })}
                  className="min-h-6 w-full min-w-0 bg-transparent text-[15px] font-bold outline-none placeholder:text-tile-subtle"
                />
                <input
                  aria-label={`Item ${i + 1} description`}
                  placeholder="Description (optional)"
                  value={item.description}
                  onChange={(e) => update(item.id, { description: e.target.value })}
                  className="min-h-6 w-full min-w-0 bg-transparent text-[13px] text-tile-muted outline-none placeholder:text-tile-subtle"
                />
              </div>
              <Menu
                trigger={
                  <button
                    type="button"
                    aria-label={`Item ${i + 1} options`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-tile-subtle"
                  >
                    <EllipsisVertical size={18} aria-hidden />
                  </button>
                }
              >
                {i > 0 && <MenuItem icon={ArrowUp} label="Move up" onSelect={() => move(i, -1)} />}
                {i < items.length - 1 && (
                  <MenuItem icon={ArrowDown} label="Move down" onSelect={() => move(i, 1)} />
                )}
                <MenuItem
                  icon={Trash2}
                  label="Remove item"
                  tone="danger"
                  onSelect={() => set({ items: items.filter((x) => x.id !== item.id) })}
                />
              </Menu>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-tile-tile p-[3px]">
                <button
                  type="button"
                  aria-label={`Decrease item ${i + 1} quantity`}
                  disabled={item.qty <= 1}
                  onClick={() => update(item.id, { qty: Math.max(1, Math.ceil(item.qty) - 1) })}
                  className="grid size-[30px] place-items-center rounded-full bg-tile-panel disabled:opacity-40"
                >
                  <Minus size={14} aria-hidden />
                </button>
                <DecimalInput
                  aria-label={`Item ${i + 1} quantity`}
                  value={item.qty}
                  onValue={(qty) => update(item.id, { qty })}
                  className="w-[34px] bg-transparent text-center text-[15px] font-bold outline-none"
                />
                <button
                  type="button"
                  aria-label={`Increase item ${i + 1} quantity`}
                  onClick={() => update(item.id, { qty: Math.floor(item.qty) + 1 })}
                  className="grid size-[30px] place-items-center rounded-full bg-tile-panel"
                >
                  <Plus size={14} aria-hidden />
                </button>
              </div>
              <span className="flex min-w-0 flex-1 items-center text-sm text-tile-muted">
                ×
                <MoneyInput
                  aria-label={`Item ${i + 1} rate`}
                  value={item.rate}
                  currency={invoice.currency}
                  format={money}
                  onValue={(rate) => update(item.id, { rate })}
                  className="ml-1 w-full min-w-0 rounded-md bg-transparent outline-none focus:bg-tile-tile focus:text-tile-fg"
                />
              </span>
              <span className="shrink-0 text-base font-bold tabular-nums">
                {money(totals.lines[i] ?? 0)}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => add()}
        className="flex h-[52px] items-center justify-center gap-2 rounded-[18px] border border-dashed border-tile-border-strong text-[15px] font-bold text-tile-accent focus-visible:outline-2 focus-visible:outline-tile-accent"
      >
        <Plus size={18} aria-hidden />
        Add item
      </button>
      {recent.length > 0 && (
        <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4">
          <span className="shrink-0 text-[13px] text-tile-muted">Quick add</span>
          {recent.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => add({ title: r.title, description: r.description, rate: r.rate })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tile-panel py-1.5 pr-[11px] pl-[9px] text-[13px] font-semibold"
            >
              <Plus size={14} aria-hidden />
              {r.title}
            </button>
          ))}
        </div>
      )}
      <dl className="flex flex-col gap-2.5 rounded-[18px] border border-tile-border bg-tile-panel px-4 py-3.5 text-sm">
        <SumRow label="Subtotal" value={money(totals.subtotal)} />
        <SumRow
          label="Discount"
          chip={invoice.discountPct ? `${invoice.discountPct}%` : undefined}
          value={totals.discount ? `−${money(totals.discount)}` : money(0)}
        />
        <SumRow label="Tax" chip={taxPct ? `${taxPct}%` : undefined} value={money(totals.tax)} />
      </dl>
    </>
  )
}

function SumRow({ label, value, chip }: { label: string; value: string; chip?: string }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-tile-muted">{label}</dt>
      {chip && <MiniChip className="bg-tile-tile">{chip}</MiniChip>}
      <dd className="ml-auto font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

/* ---------- 4 · Review ---------- */

function ReviewStep({ onStep, onPreview }: { onStep: (s: Step) => void; onPreview: () => void }) {
  const { invoice, client, settings, set, totals, money } = useEditor()
  const view = useInvoiceView()
  const name = invoice.clientSnapshot?.name ?? client?.name
  const accents = Object.keys(ACCENTS) as Accent[]

  return (
    <>
      {invoice.status === 'draft' ? (
        <Heading title="Review & download" sub="This is exactly what your client will see." />
      ) : (
        <StatusBlock />
      )}
      <div className="relative overflow-hidden rounded-[22px] bg-linear-to-b from-[#e9ecf1] to-[#dce1e8] pt-12">
        {/* Tapping the page opens the full preview; the Expand button does the same for keyboard and screen readers. */}
        <div
          onClick={onPreview}
          className="block max-h-[300px] w-full cursor-zoom-in overflow-hidden px-4"
        >
          <div className="mx-auto w-fit">
            <ScaledPage view={view} zoom={(358 - 32) / PAGE_WIDTH} />
          </div>
        </div>
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-semibold">
          <span className="size-[7px] rounded-full bg-tile-success" aria-hidden />
          {TEMPLATE_LABELS[invoice.templateId]} · {view.paper === 'a4' ? 'A4' : 'Letter'}
        </span>
        <button
          type="button"
          aria-label="Expand preview"
          onClick={onPreview}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90"
        >
          <Maximize2 size={16} aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-3 rounded-[18px] border border-tile-border bg-tile-panel p-3.5">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Template">
          {(Object.keys(TEMPLATE_LABELS) as TemplateId[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={invoice.templateId === t}
              onClick={() => set({ templateId: t })}
              className={cn(
                'flex-1 rounded-full px-2 py-[9px] text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-tile-accent',
                invoice.templateId === t ? 'bg-tile-fg text-white' : 'bg-tile-tile text-tile-fg',
              )}
            >
              {TEMPLATE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[13px] text-tile-muted">Accent</span>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Accent colour">
            {accents.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={settings.accent === a}
                aria-label={a}
                onClick={() => void updateSettings({ accent: a })}
                className={cn(
                  'grid size-7 place-items-center rounded-full border-[1.5px]',
                  settings.accent === a ? 'border-tile-fg' : 'border-transparent',
                )}
              >
                <span className="size-5 rounded-full" style={{ background: ACCENTS[a] }} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <ul className="flex flex-col rounded-[18px] border border-tile-border bg-tile-panel px-3.5">
        <ReviewRow
          icon={UserRound}
          label="Client"
          value={name ?? 'Choose a client'}
          onClick={() => onStep('client')}
        />
        <ReviewRow
          icon={Calendar}
          label="Due"
          value={`${formatDate(invoice.dueDate, 'd MMM')} · ${TERM_LABELS[invoice.terms]}`}
          onClick={() => onStep('details')}
        />
        <ReviewRow
          icon={List}
          label="Items"
          value={`${invoice.items.length} item${invoice.items.length === 1 ? '' : 's'} · ${money(totals.total)}`}
          onClick={() => onStep('items')}
        />
      </ul>
    </>
  )
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof UserRound
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <li className="border-b border-tile-border last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-[13px] text-left text-sm focus-visible:outline-2 focus-visible:outline-tile-accent"
      >
        <Icon size={17} className="shrink-0 text-tile-muted" aria-hidden />
        <span className="text-tile-muted">{label}</span>
        <span className="ml-auto truncate font-semibold">{value}</span>
        <ChevronRight size={16} className="shrink-0 text-tile-subtle" aria-hidden />
      </button>
    </li>
  )
}

/** Editor — Existing invoice: amount, due state, compact stepper and actions. */
function StatusBlock() {
  const { invoice, status, totals, money } = useEditor()
  const navigate = useNavigate()
  const toast = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const pdf = useDownloadPdf()
  const today = todayISO()
  const late = status === 'overdue'
  const short = (iso: string | null) =>
    iso ? formatDate(iso.length > 10 ? todayISO(new Date(iso)) : iso, 'd MMM') : '—'
  const daysLate = late
    ? Math.round((Date.parse(today) - Date.parse(invoice.dueDate)) / 86_400_000)
    : 0

  async function duplicate() {
    const copy = await duplicateInvoice(invoice.id)
    toast({ message: `Duplicated as ${copy.number}` })
    navigate(`/invoices/${copy.id}?step=details`)
  }

  async function remove() {
    const removed = await deleteInvoice(invoice.id)
    navigate('/', { replace: true })
    if (removed)
      toast({
        message: `${removed.number} deleted`,
        action: { label: 'Undo', onClick: () => void restoreInvoice(removed) },
      })
  }

  return (
    <section
      aria-label="Status"
      className="flex flex-col gap-3.5 rounded-[20px] border border-tile-border bg-tile-panel p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[30px] leading-none font-bold tracking-[-1px] tabular-nums">
            {money(totals.total)}
          </span>
          <span
            className={cn(
              'text-[13px] font-semibold',
              late ? 'text-tile-danger-ink' : 'text-tile-muted',
            )}
          >
            {status === 'paid'
              ? `Paid on ${short(invoice.paidAt)}`
              : late
                ? `Was due ${short(invoice.dueDate)} · ${daysLate} day${daysLate === 1 ? '' : 's'} late`
                : `Due ${short(invoice.dueDate)}`}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Invoice progress">
        <li className="flex items-center gap-1.5 font-bold">
          <CircleCheck size={14} aria-hidden /> Draft
          <span className="font-normal text-tile-muted">{short(invoice.createdAt)}</span>
        </li>
        <li
          className={cn('flex items-center gap-1.5 font-bold', late ? 'text-tile-danger-ink' : '')}
        >
          <Send size={14} aria-hidden /> {late ? 'Overdue' : 'Sent'}
          <span className="font-normal text-tile-muted">{short(invoice.sentAt)}</span>
        </li>
        <li
          className={cn(
            'flex items-center gap-1.5 font-bold',
            status === 'paid' ? 'text-tile-success-ink' : 'text-tile-muted',
          )}
        >
          <CircleCheck size={14} aria-hidden /> Paid
          <span className="font-normal text-tile-muted">{short(invoice.paidAt)}</span>
        </li>
      </ol>
      <div className="flex gap-2 [&>button]:flex-1 [&>button]:px-3">
        <Button
          icon={Download}
          disabled={pdf.busy}
          onClick={() => void pdf.download()}
          className="justify-center"
        >
          PDF
        </Button>
        <Button icon={Copy} onClick={duplicate} className="justify-center">
          Duplicate
        </Button>
        <Button
          variant="danger-soft"
          icon={Trash2}
          onClick={() => setDeleteOpen(true)}
          className="justify-center"
        >
          Delete
        </Button>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        icon={Trash2}
        tone="danger"
        title={`Delete ${invoice.number}?`}
        description={`This removes the ${money(totals.total)} invoice from this browser. There's no account to restore it from.`}
        confirmLabel="Delete invoice"
        confirmIcon={Trash2}
        onConfirm={remove}
      >
        <p className="flex items-center gap-2.5 rounded-tile-md bg-tile-tile px-3.5 py-3 text-sm text-tile-muted">
          <HardDriveDownload size={17} className="shrink-0" aria-hidden />
          Not sure? Export a backup first.
        </p>
      </ConfirmDialog>
    </section>
  )
}

/* ---------- Action bar ---------- */

function ActionBar({ step, onNext }: { step: Step; onNext?: () => void }) {
  const { invoice, client, status, totals, money, date } = useEditor()
  const { openPaid, dialog } = useStatusChange()
  const pdf = useDownloadPdf()
  const [sendAfter, setSendAfter] = useState(true)
  const name = invoice.clientSnapshot?.name ?? client?.name
  const days = Math.round((Date.parse(invoice.dueDate) - Date.parse(todayISO())) / 86_400_000)

  const summary = {
    client: { label: 'Bill to', value: name ?? 'No client yet' },
    details: {
      label:
        days > 0
          ? `Due in ${days} day${days === 1 ? '' : 's'}`
          : days === 0
            ? 'Due today'
            : 'Past due',
      value: date(invoice.dueDate),
    },
    items: { label: 'Total due', value: money(totals.total) },
    review: { label: 'Total due', value: money(totals.total) },
  }[step]

  const nextLabel = { client: 'Details', details: 'Items', items: 'Review', review: '' }[step]
  const primary =
    'inline-flex h-11 shrink-0 items-center gap-2 rounded-full pr-[18px] pl-[22px] text-[15px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent disabled:opacity-50'

  return (
    <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-tile-border bg-tile-panel pt-3.5 pr-4 pb-[max(30px,env(safe-area-inset-bottom))] pl-5">
      {step === 'review' && invoice.status === 'draft' && (
        <Toggle checked={sendAfter} onCheckedChange={setSendAfter}>
          Mark as sent after download
        </Toggle>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-px">
          <span className="text-xs text-tile-muted">{summary.label}</span>
          <span className="truncate text-[17px] font-bold tabular-nums">{summary.value}</span>
        </div>
        {onNext ? (
          <button type="button" onClick={onNext} className={cn(primary, 'bg-tile-fg')}>
            {nextLabel}
            <ArrowRight size={17} aria-hidden />
          </button>
        ) : status === 'sent' || status === 'overdue' ? (
          <button type="button" onClick={openPaid} className={cn(primary, 'bg-tile-accent')}>
            Mark as paid
            <CircleCheck size={17} aria-hidden />
          </button>
        ) : status === 'draft' ? (
          <button
            type="button"
            disabled={pdf.busy}
            onClick={() => void pdf.download({ markSent: sendAfter })}
            className={cn(primary, 'bg-tile-accent')}
          >
            {pdf.busy ? 'Preparing…' : 'Download PDF'}
            <Download size={17} aria-hidden />
          </button>
        ) : (
          <Link to="/" className={cn(primary, 'bg-tile-fg')}>
            Done
            <Check size={17} aria-hidden />
          </Link>
        )}
      </div>
      {dialog}
    </div>
  )
}
