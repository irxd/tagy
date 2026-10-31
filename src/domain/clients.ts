import type { Client, ISODate, Invoice } from '@/db/types'
import { displayStatus } from './status'
import { invoiceTotal } from './totals'

/** The one-word state on a client card. */
export type ClientHint = 'overdue' | 'unpaid' | 'draft' | 'paid' | 'new'

export interface CurrencyTotal {
  currency: string
  billed: number
  unpaid: number
  overdue: number
}

export interface ClientStats {
  invoiceCount: number
  /** Sent + paid invoices in the client's primary currency (drafts aren't billed yet). */
  billed: number
  /** Sent invoices not yet paid in the client's primary currency, overdue included. */
  unpaid: number
  overdue: number
  lastIssueDate: ISODate | null
  hint: ClientHint
  /** Amounts in other currencies for this client, never combined. */
  otherCurrencies: CurrencyTotal[]
  /** All unique currencies used across invoices for this client (e.g. ['MYR', 'IDR']). */
  currencies: string[]
}

/**
 * Per-client figures for the Clients grid. Amounts only count invoices in
 * `currency` — totals never mix currencies (decision 7). Invoices in other
 * currencies are tracked in `otherCurrencies`.
 */
export function clientStats(invoices: Invoice[], currency: string, today: ISODate): ClientStats {
  let billed = 0
  let unpaid = 0
  let overdue = 0
  let hasDraft = false
  let lastIssueDate: ISODate | null = null

  let hasOverdue = false
  let hasUnpaid = false

  const otherMap = new Map<string, CurrencyTotal>()
  const currencySet = new Set<string>()

  for (const inv of invoices) {
    currencySet.add(inv.currency)
    if (!lastIssueDate || inv.issueDate > lastIssueDate) lastIssueDate = inv.issueDate
    const status = displayStatus(inv, today)
    if (status === 'overdue') {
      hasOverdue = true
      hasUnpaid = true
    } else if (status === 'sent') {
      hasUnpaid = true
    } else if (status === 'draft') {
      hasDraft = true
    }

    if (status === 'draft') continue
    const total = invoiceTotal(inv)

    if (inv.currency === currency) {
      billed += total
      if (status !== 'paid') unpaid += total
      if (status === 'overdue') overdue += total
    } else {
      const entry = otherMap.get(inv.currency) ?? {
        currency: inv.currency,
        billed: 0,
        unpaid: 0,
        overdue: 0,
      }
      entry.billed += total
      if (status !== 'paid') entry.unpaid += total
      if (status === 'overdue') entry.overdue += total
      otherMap.set(inv.currency, entry)
    }
  }

  const hint: ClientHint =
    hasOverdue
      ? 'overdue'
      : hasUnpaid
        ? 'unpaid'
        : hasDraft
          ? 'draft'
          : invoices.length > 0
            ? 'paid'
            : 'new'

  const currencies = currencySet.size > 0 ? Array.from(currencySet) : [currency]
  if (currencies.includes(currency)) {
    currencies.sort((a, b) => (a === currency ? -1 : b === currency ? 1 : a.localeCompare(b)))
  }

  const otherCurrencies = Array.from(otherMap.values())

  return {
    invoiceCount: invoices.length,
    billed,
    unpaid,
    overdue,
    lastIssueDate,
    hint,
    otherCurrencies,
    currencies,
  }
}

/**
 * Resolves the display currency for a client:
 * 1. If the client has an explicit currency override and has matching invoices (or no invoices), use it.
 * 2. If the client has invoices, use the currency of their unpaid/overdue invoice or most recent invoice.
 * 3. Otherwise fall back to the client's currency or app default currency.
 */
export function resolveClientCurrency(
  client: Pick<Client, 'currency'>,
  invoices: Invoice[],
  defaultCurrency: string,
): string {
  if (client.currency) {
    const hasMatching = invoices.some((inv) => inv.currency === client.currency)
    if (hasMatching || invoices.length === 0) {
      return client.currency
    }
  }
  if (invoices.length > 0) {
    const sorted = [...invoices].sort(
      (a, b) =>
        b.issueDate.localeCompare(a.issueDate) ||
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    )
    const unpaid = sorted.find((inv) => inv.status === 'sent')
    if (unpaid) return unpaid.currency
    return sorted[0]!.currency
  }
  return client.currency ?? defaultCurrency
}

/** Case-insensitive search over name, contact and email. */
export function matchesClient(client: Client, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [client.name, client.contact, client.email].some((v) => v.toLowerCase().includes(q))
}
