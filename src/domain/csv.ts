import type { ISODate, Invoice, TaxRate } from '@/db/types'
import { minorToDecimal } from './money'
import { displayStatus } from './status'
import { computeTotals, invoiceTaxPct } from './totals'

const HEADER = [
  'Number',
  'Status',
  'Client',
  'Issue date',
  'Due date',
  'Currency',
  'Subtotal',
  'Discount',
  'Tax',
  'Total',
  'Paid on',
  'Payment method',
  'Reference',
]

/** Quotes a cell when it holds a comma, quote or line break (RFC 4180). */
function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Invoices as CSV for accountants and spreadsheets: one row per invoice,
 * dates as YYYY-MM-DD and amounts as plain decimals in each invoice's own
 * currency (no symbols or grouping), so they sort and sum as numbers.
 */
export function invoicesToCsv(
  invoices: Invoice[],
  clientName: (invoice: Invoice) => string,
  taxRates: TaxRate[],
  today: ISODate,
): string {
  const rows = invoices.map((inv) => {
    const totals = computeTotals({
      items: inv.items,
      discountPct: inv.discountPct,
      taxPct: invoiceTaxPct(inv, taxRates),
    })
    const amount = (minor: number) => minorToDecimal(minor, inv.currency)
    return [
      inv.number,
      displayStatus(inv, today),
      clientName(inv),
      inv.issueDate,
      inv.dueDate,
      inv.currency,
      amount(totals.subtotal),
      amount(totals.discount),
      amount(totals.tax),
      amount(totals.total),
      inv.paidAt ?? '',
      inv.paidMethod,
      inv.reference,
    ]
  })
  return [HEADER, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n'
}
