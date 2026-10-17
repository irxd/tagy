import { useMemo, useState } from 'react'
import { useClients, useInvoices, useSettings } from '@/db/hooks'
import type { AppSettings, Invoice } from '@/db/types'
import { formatDate, todayISO } from '@/domain/dates'
import { formatMoney, formatMoneyCompact } from '@/domain/money'
import { inPeriod, overviewStats, type OverviewStats, type Period } from '@/domain/overview'
import { displayStatus, type DisplayStatus } from '@/domain/status'
import { invoiceTotal } from '@/domain/totals'

export interface InvoiceRow {
  invoice: Invoice
  status: DisplayStatus
  clientName: string
  /** Formatted total in the invoice's own currency. */
  total: string
}

export interface Overview {
  settings: AppSettings
  stats: OverviewStats
  /** Invoices in the period, newest first. */
  rows: InvoiceRow[]
  /** True when no invoice exists at all (first visit). */
  empty: boolean
  period: Period
  setPeriod: (p: Period) => void
  money: (minor: number) => string
  compact: (minor: number) => string
  date: (iso: string, pattern?: string) => string
  today: string
}

export function useOverview(): Overview | undefined {
  const invoices = useInvoices()
  const clients = useClients({ includeArchived: true })
  const settings = useSettings()
  const [period, setPeriod] = useState<Period>('6m')

  return useMemo(() => {
    if (!invoices || !clients || !settings) return undefined
    const today = todayISO()
    const names = new Map(clients.map((c) => [c.id, c.name]))
    const { currency, locale, taxRates } = settings
    const rows = invoices
      .filter((inv) => inPeriod(inv, period, today))
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number))
      .map((invoice) => ({
        invoice,
        status: displayStatus(invoice, today),
        clientName:
          invoice.clientSnapshot?.name ??
          (invoice.clientId && names.get(invoice.clientId)) ??
          'No client',
        total: formatMoney(invoiceTotal(invoice, taxRates), invoice.currency, locale),
      }))
    return {
      settings,
      stats: overviewStats(invoices, { currency, taxRates, today, period }),
      rows,
      empty: invoices.length === 0,
      period,
      setPeriod,
      money: (minor: number) => formatMoney(minor, currency, locale),
      compact: (minor: number) => formatMoneyCompact(minor, currency, locale),
      date: (iso: string, pattern = settings.dateFormat) => formatDate(iso, pattern),
      today,
    }
  }, [invoices, clients, settings, period])
}
