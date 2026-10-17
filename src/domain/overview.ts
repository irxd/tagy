import type { ISODate, Invoice, TaxRate } from '@/db/types'
import { formatDate } from './dates'
import { displayStatus, type DisplayStatus } from './status'
import { invoiceTotal } from './totals'

export type Period = '3m' | '6m' | '12m' | 'all'

export const PERIOD_LABELS: Record<Period, string> = {
  '3m': 'Last 3 months',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
  all: 'All time',
}

const PERIOD_MONTHS: Record<Exclude<Period, 'all'>, number> = { '3m': 3, '6m': 6, '12m': 12 }

/** `2026-10` for a date. */
const monthOf = (date: ISODate) => date.slice(0, 7)

/** The month `n` months before `month` (`2026-10`, 2 → `2026-08`). */
function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const index = y * 12 + (m - 1) - n
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

/** Calendar months covered by a period, oldest first, ending with this month. */
export function periodMonths(period: Period, today: ISODate): string[] {
  const count = period === 'all' ? 12 : PERIOD_MONTHS[period]
  const current = monthOf(today)
  return Array.from({ length: count }, (_, i) => shiftMonth(current, count - 1 - i))
}

/** Whether an invoice falls in the period, by issue date. */
export function inPeriod(invoice: Pick<Invoice, 'issueDate'>, period: Period, today: ISODate) {
  if (period === 'all') return true
  return monthOf(invoice.issueDate) >= periodMonths(period, today)[0]!
}

export interface MonthBar {
  month: string
  /** `Oct` */
  label: string
  billed: number
}

export interface OverviewStats {
  /** Sent + paid in the period, default currency. */
  billed: number
  paid: number
  unpaid: number
  overdue: number
  counts: Record<DisplayStatus | 'all', number>
  months: MonthBar[]
  best: MonthBar | null
  /** % change in billed against the previous period of the same length; null without a baseline. */
  trend: number | null
  /** Billed in other currencies, never converted (decision 7). */
  otherCurrencies: { currency: string; billed: number }[]
  /** `May – Oct 2026` */
  rangeLabel: string
}

/**
 * Everything the Overview shows for a period. Amounts only add up invoices
 * in `currency`; drafts count as invoices but not as billed.
 */
export function overviewStats(
  invoices: Invoice[],
  {
    currency,
    taxRates,
    today,
    period,
  }: { currency: string; taxRates: TaxRate[]; today: ISODate; period: Period },
): OverviewStats {
  const months = periodMonths(period, today)
  const bars = new Map(months.map((m) => [m, 0]))
  const counts = { all: 0, draft: 0, sent: 0, overdue: 0, paid: 0 }
  const other = new Map<string, number>()
  let billed = 0
  let paid = 0
  let unpaid = 0
  let overdue = 0
  let previous = 0

  const length = period === 'all' ? 0 : PERIOD_MONTHS[period]
  const previousStart = length ? shiftMonth(months[0]!, length) : null

  for (const inv of invoices) {
    const status = displayStatus(inv, today)
    const total = status === 'draft' ? 0 : invoiceTotal(inv, taxRates)
    const month = monthOf(inv.issueDate)

    if (!inPeriod(inv, period, today)) {
      if (
        previousStart &&
        status !== 'draft' &&
        inv.currency === currency &&
        month >= previousStart
      )
        previous += total
      continue
    }

    counts.all++
    counts[status]++
    if (status === 'draft') continue
    if (inv.currency !== currency) {
      other.set(inv.currency, (other.get(inv.currency) ?? 0) + total)
      continue
    }
    billed += total
    if (status === 'paid') paid += total
    else unpaid += total
    if (status === 'overdue') overdue += total
    if (bars.has(month)) bars.set(month, bars.get(month)! + total)
  }

  const monthBars = months.map((month) => ({
    month,
    label: formatDate(`${month}-01`, 'MMM'),
    billed: bars.get(month)!,
  }))
  const best = monthBars.reduce<MonthBar | null>(
    (top, bar) => (bar.billed > 0 && (!top || bar.billed >= top.billed) ? bar : top),
    null,
  )
  const first = `${months[0]}-01`
  const last = `${months.at(-1)}-01`
  const sameYear = first.slice(0, 4) === last.slice(0, 4)

  return {
    billed,
    paid,
    unpaid,
    overdue,
    counts,
    months: monthBars,
    best,
    trend: previous > 0 ? ((billed - previous) / previous) * 100 : null,
    otherCurrencies: [...other].map(([c, b]) => ({ currency: c, billed: b })),
    rangeLabel:
      period === 'all'
        ? 'All time'
        : `${formatDate(first, sameYear ? 'MMM' : 'MMM yyyy')} – ${formatDate(last, 'MMM yyyy')}`,
  }
}

/** Search the invoice list by client name or invoice number. */
export function matchesInvoice(
  invoice: Pick<Invoice, 'number'>,
  clientName: string,
  query: string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return invoice.number.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)
}
