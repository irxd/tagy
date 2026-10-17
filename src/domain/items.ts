import type { Invoice, LineItem } from '@/db/types'

export function newLineItem(patch: Partial<LineItem> = {}): LineItem {
  return { id: crypto.randomUUID(), title: '', description: '', qty: 1, rate: 0, ...patch }
}

/**
 * "Recent items" (decision 1, in place of a products catalogue): the last
 * few distinct line items from other invoices, most recently edited first.
 * Items match by title, ignoring case.
 */
export function recentItems(
  invoices: Pick<Invoice, 'id' | 'items' | 'updatedAt'>[],
  excludeInvoiceId: string,
  limit = 5,
): LineItem[] {
  const seen = new Set<string>()
  const result: LineItem[] = []
  const sorted = [...invoices].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  for (const invoice of sorted) {
    if (invoice.id === excludeInvoiceId) continue
    for (const item of invoice.items) {
      const key = item.title.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      result.push(item)
      if (result.length === limit) return result
    }
  }
  return result
}
