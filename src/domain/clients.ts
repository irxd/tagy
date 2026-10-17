import type { Client, ISODate, Invoice, TaxRate } from '@/db/types'
import { displayStatus } from './status'
import { invoiceTotal } from './totals'

/** The one-word state on a client card. */
export type ClientHint = 'overdue' | 'unpaid' | 'draft' | 'paid' | 'new'

export interface ClientStats {
  invoiceCount: number
  /** Sent + paid invoices in the client's currency (drafts aren't billed yet). */
  billed: number
  /** Sent invoices not yet paid, overdue included. */
  unpaid: number
  overdue: number
  lastIssueDate: ISODate | null
  hint: ClientHint
}

/**
 * Per-client figures for the Clients grid. Amounts only count invoices in
 * `currency` — totals never mix currencies (decision 7).
 */
export function clientStats(
  invoices: Invoice[],
  currency: string,
  taxRates: TaxRate[],
  today: ISODate,
): ClientStats {
  let billed = 0
  let unpaid = 0
  let overdue = 0
  let hasDraft = false
  let lastIssueDate: ISODate | null = null

  for (const inv of invoices) {
    if (!lastIssueDate || inv.issueDate > lastIssueDate) lastIssueDate = inv.issueDate
    const status = displayStatus(inv, today)
    if (status === 'draft') {
      hasDraft = true
      continue
    }
    if (inv.currency !== currency) continue
    const total = invoiceTotal(inv, taxRates)
    billed += total
    if (status !== 'paid') unpaid += total
    if (status === 'overdue') overdue += total
  }

  const hint: ClientHint =
    overdue > 0
      ? 'overdue'
      : unpaid > 0
        ? 'unpaid'
        : hasDraft
          ? 'draft'
          : invoices.length > 0
            ? 'paid'
            : 'new'

  return { invoiceCount: invoices.length, billed, unpaid, overdue, lastIssueDate, hint }
}

/** Case-insensitive search over name, contact and email. */
export function matchesClient(client: Client, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [client.name, client.contact, client.email].some((v) => v.toLowerCase().includes(q))
}
