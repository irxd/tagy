import { describe, expect, it } from 'vitest'
import type { Invoice } from '@/db/types'
import { inPeriod, matchesInvoice, overviewStats, periodMonths } from './overview'

const today = '2026-10-18'
const inv = (patch: Partial<Invoice>): Invoice =>
  ({
    number: 'INV-0001',
    status: 'sent',
    issueDate: '2026-10-01',
    dueDate: '2026-12-01',
    currency: 'USD',
    items: [{ id: 'a', title: 'Work', description: '', qty: 1, rate: 10_000 }],
    discountPct: 0,
    applyTax: false,
    taxRateId: null,
    taxSnapshot: null,
    ...patch,
  }) as Invoice

const stats = (invoices: Invoice[], period: '3m' | '6m' | '12m' | 'all' = '6m') =>
  overviewStats(invoices, { currency: 'USD', taxRates: [], today, period })

describe('periods', () => {
  it('lists the months of a period, ending this month', () => {
    expect(periodMonths('3m', today)).toEqual(['2026-08', '2026-09', '2026-10'])
    expect(periodMonths('6m', '2026-02-10')).toEqual([
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ])
    expect(periodMonths('all', today)).toHaveLength(12)
  })

  it('checks whether an invoice is in the period by issue date', () => {
    expect(inPeriod({ issueDate: '2026-05-01' }, '6m', today)).toBe(true)
    expect(inPeriod({ issueDate: '2026-04-30' }, '6m', today)).toBe(false)
    expect(inPeriod({ issueDate: '2001-01-01' }, 'all', today)).toBe(true)
  })
})

describe('overviewStats', () => {
  it('splits billed into paid and unpaid, counting overdue', () => {
    const s = stats([
      inv({ status: 'paid' }),
      inv({ status: 'sent' }),
      inv({ status: 'sent', dueDate: '2026-10-10' }),
      inv({ status: 'draft' }),
    ])
    expect(s).toMatchObject({ billed: 30_000, paid: 10_000, unpaid: 20_000, overdue: 10_000 })
    expect(s.counts).toEqual({ all: 4, draft: 1, sent: 1, overdue: 1, paid: 1 })
  })

  it('charts billed per month and names the best month', () => {
    const s = stats([
      inv({ issueDate: '2026-09-03' }),
      inv({
        issueDate: '2026-10-03',
        items: [{ id: 'b', title: '', description: '', qty: 3, rate: 10_000 }],
      }),
    ])
    expect(s.months.map((m) => [m.label, m.billed])).toEqual([
      ['May', 0],
      ['Jun', 0],
      ['Jul', 0],
      ['Aug', 0],
      ['Sep', 10_000],
      ['Oct', 30_000],
    ])
    expect(s.best?.label).toBe('Oct')
    expect(stats([]).best).toBeNull()
    expect(s.rangeLabel).toBe('May – Oct 2026')
    expect(stats([], '12m').rangeLabel).toBe('Nov 2025 – Oct 2026')
    expect(stats([], 'all').rangeLabel).toBe('All time')
  })

  it('compares with the previous period of the same length', () => {
    const s = stats(
      [
        inv({
          issueDate: '2026-02-01',
          items: [{ id: 'p', title: '', description: '', qty: 1, rate: 8_000 }],
        }),
        inv({}),
      ],
      '6m',
    )
    expect(s.trend).toBeCloseTo(25)
    expect(stats([inv({})]).trend).toBeNull()
  })

  it('keeps other currencies apart and leaves out older invoices', () => {
    const s = stats([
      inv({ currency: 'EUR' }),
      inv({ currency: 'EUR' }),
      inv({ issueDate: '2025-01-01' }),
    ])
    expect(s.billed).toBe(0)
    expect(s.otherCurrencies).toEqual([{ currency: 'EUR', billed: 20_000 }])
    expect(s.counts.all).toBe(2)
  })

  it('all time counts invoices older than the twelve charted months', () => {
    const s = stats([inv({ issueDate: '2020-03-01' })], 'all')
    expect(s.billed).toBe(10_000)
    expect(s.months.every((m) => m.billed === 0)).toBe(true)
  })
})

describe('matchesInvoice', () => {
  it('matches the number or the client name', () => {
    expect(matchesInvoice({ number: 'INV-0042' }, 'Northwind', '0042')).toBe(true)
    expect(matchesInvoice({ number: 'INV-0042' }, 'Northwind', 'north')).toBe(true)
    expect(matchesInvoice({ number: 'INV-0042' }, 'Northwind', 'acme')).toBe(false)
    expect(matchesInvoice({ number: 'INV-0042' }, 'Northwind', ' ')).toBe(true)
  })
})
