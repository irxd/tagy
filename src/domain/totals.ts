import type { Invoice, LineItem } from '@/db/types'
import { lineAmount, percentOf } from './money'

export interface TotalsInput {
  items: Pick<LineItem, 'qty' | 'rate'>[]
  discountPct: number
  /** Null when no tax applies (no rate set, or Apply tax is off). */
  taxPct: number | null
}

export interface Totals {
  /** Rounded amount per line, in item order. */
  lines: number[]
  subtotal: number
  discount: number
  /** Subtotal after discount — the base tax is charged on. */
  taxable: number
  tax: number
  total: number
}

/**
 * The calculation from the handoff, all in minor units:
 * line = qty × rate (rounded), subtotal = Σ lines,
 * discount = subtotal × discount%, tax = (subtotal − discount) × tax%,
 * total = subtotal − discount + tax. Each step rounds half-up.
 */
export function computeTotals({ items, discountPct, taxPct }: TotalsInput): Totals {
  const lines = items.map((item) => lineAmount(item.qty, item.rate))
  const subtotal = lines.reduce((sum, amount) => sum + amount, 0)
  const discount = discountPct ? percentOf(subtotal, discountPct) : 0
  const taxable = subtotal - discount
  const tax = taxPct ? percentOf(taxable, taxPct) : 0
  return { lines, subtotal, discount, taxable, tax, total: taxable + tax }
}

/** Tax percent that applies to an invoice: its own rate, unless Apply tax is off or it is 0. */
export function invoiceTaxPct(invoice: Pick<Invoice, 'applyTax' | 'taxPct'>): number | null {
  return invoice.applyTax && invoice.taxPct > 0 ? invoice.taxPct : null
}

/** Total due for an invoice, in its currency's minor units. */
export function invoiceTotal(
  invoice: Pick<Invoice, 'items' | 'discountPct' | 'applyTax' | 'taxPct'>,
): number {
  return computeTotals({
    items: invoice.items,
    discountPct: invoice.discountPct,
    taxPct: invoiceTaxPct(invoice),
  }).total
}
