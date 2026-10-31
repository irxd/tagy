import { useMemo } from 'react'
import { useClients, useInvoices, useSettings } from '@/db/hooks'
import type { AppSettings, Client, Invoice } from '@/db/types'
import { clientStats, resolveClientCurrency, type ClientStats } from '@/domain/clients'
import { todayISO } from '@/domain/dates'

export interface ClientRow {
  client: Client
  stats: ClientStats
  /** Currency the client's amounts are shown in. */
  currency: string
}

export interface ClientsData {
  rows: ClientRow[]
  settings: AppSettings
}

/** Every client (archived included) with its stats; undefined while loading. */
export function useClientRows(): ClientsData | undefined {
  const clients = useClients({ includeArchived: true })
  const invoices = useInvoices()
  const settings = useSettings()

  return useMemo(() => {
    if (!clients || !invoices || !settings) return undefined
    const byClient = new Map<string, Invoice[]>()
    for (const inv of invoices) {
      if (!inv.clientId) continue
      byClient.set(inv.clientId, [...(byClient.get(inv.clientId) ?? []), inv])
    }
    const today = todayISO()
    const rows = clients.map((client) => {
      const clientInvoices = byClient.get(client.id) ?? []
      const currency = resolveClientCurrency(client, clientInvoices, settings.currency)
      const stats = clientStats(clientInvoices, currency, today)
      return { client, stats, currency }
    })
    return { rows, settings }
  }, [clients, invoices, settings])
}

export type ClientFilter = 'all' | 'unpaid' | 'archived'

export function filterRows(rows: ClientRow[], filter: ClientFilter): ClientRow[] {
  switch (filter) {
    case 'all':
      return rows.filter((r) => !r.client.archived)
    case 'unpaid':
      return rows.filter(
        (r) =>
          !r.client.archived &&
          (r.stats.unpaid > 0 ||
            r.stats.otherCurrencies.some((c) => c.unpaid > 0) ||
            r.stats.hint === 'unpaid' ||
            r.stats.hint === 'overdue'),
      )
    case 'archived':
      return rows.filter((r) => r.client.archived)
  }
}
