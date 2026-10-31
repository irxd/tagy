import { describe, expect, it } from 'vitest'
import type { Client, Invoice } from '@/db/types'
import { clientStats, matchesClient, resolveClientCurrency } from './clients'
import { invoiceTaxPct, invoiceTotal } from './totals'

const today = '2026-10-18'

const inv = (patch: Partial<Invoice>): Invoice =>
  ({
    status: 'sent',
    issueDate: '2026-10-01',
    dueDate: '2026-10-30',
    currency: 'USD',
    items: [{ id: 'l', title: 'Work', description: '', qty: 1, rate: 10_000 }],
    discountPct: 0,
    applyTax: false,
    taxPct: 0,
    ...patch,
  }) as Invoice

describe('invoice totals', () => {
  it("uses the invoice's own rate", () => {
    const taxed = inv({ applyTax: true, taxPct: 5 })
    expect(invoiceTaxPct(taxed)).toBe(5)
    expect(invoiceTotal(taxed)).toBe(10_500)
  })

  it('uses no tax when Apply tax is off or the rate is 0', () => {
    expect(invoiceTaxPct(inv({ applyTax: false, taxPct: 10 }))).toBeNull()
    expect(invoiceTaxPct(inv({ applyTax: true, taxPct: 0 }))).toBeNull()
  })
})

describe('clientStats', () => {
  it('splits billed, unpaid and overdue and finds the last invoice', () => {
    const stats = clientStats(
      [
        inv({ status: 'paid', issueDate: '2026-09-01' }),
        inv({ status: 'sent', issueDate: '2026-10-16' }),
        inv({ status: 'sent', dueDate: '2026-10-10', issueDate: '2026-09-26' }),
      ],
      'USD',
      today,
    )
    expect(stats).toEqual({
      invoiceCount: 3,
      billed: 30_000,
      unpaid: 20_000,
      overdue: 10_000,
      lastIssueDate: '2026-10-16',
      hint: 'overdue',
      otherCurrencies: [],
      currencies: ['USD'],
    })
  })

  it('tracks other currencies for multi-currency clients', () => {
    const stats = clientStats(
      [
        inv({
          status: 'sent',
          currency: 'MYR',
          items: [{ id: '1', title: 'Work', description: '', qty: 1, rate: 50_000 }],
        }),
        inv({
          status: 'sent',
          currency: 'IDR',
          items: [{ id: '2', title: 'Work', description: '', qty: 1, rate: 2_000_000 }],
        }),
      ],
      'MYR',
      today,
    )
    expect(stats.billed).toBe(50_000)
    expect(stats.unpaid).toBe(50_000)
    expect(stats.currencies).toEqual(['MYR', 'IDR'])
    expect(stats.otherCurrencies).toEqual([
      { currency: 'IDR', billed: 2_000_000, unpaid: 2_000_000, overdue: 0 },
    ])
    expect(stats.hint).toBe('unpaid')
  })

  it('leaves drafts and other currencies out of the amounts', () => {
    const stats = clientStats(
      [inv({ status: 'draft' }), inv({ status: 'sent', currency: 'EUR' })],
      'USD',
      today,
    )
    expect(stats).toMatchObject({ invoiceCount: 2, billed: 0, unpaid: 0, hint: 'unpaid' })
  })

  it('identifies overdue or unpaid invoices even in another currency', () => {
    expect(clientStats([inv({ status: 'sent', currency: 'IDR' })], 'MYR', today).hint).toBe(
      'unpaid',
    )
    expect(
      clientStats([inv({ status: 'sent', dueDate: '2026-10-10', currency: 'IDR' })], 'MYR', today)
        .hint,
    ).toBe('overdue')
  })

  it('tracks paid and overdue invoices in other currencies', () => {
    const stats = clientStats(
      [
        inv({ status: 'paid', currency: 'EUR' }),
        inv({ status: 'sent', dueDate: '2026-10-10', currency: 'GBP' }),
      ],
      'USD',
      today,
    )
    expect(stats.otherCurrencies).toEqual([
      { currency: 'EUR', billed: 10_000, unpaid: 0, overdue: 0 },
      { currency: 'GBP', billed: 10_000, unpaid: 10_000, overdue: 10_000 },
    ])
    expect(stats.currencies).toEqual(['EUR', 'GBP'])
  })

  it('picks the hint by priority', () => {
    expect(clientStats([inv({ status: 'sent' })], 'USD', today).hint).toBe('unpaid')
    expect(clientStats([inv({ status: 'paid' })], 'USD', today).hint).toBe('paid')
    expect(clientStats([inv({ status: 'draft' })], 'USD', today).hint).toBe('draft')
    expect(clientStats([], 'USD', today)).toMatchObject({ hint: 'new', lastIssueDate: null })
  })
})

describe('resolveClientCurrency', () => {
  it('uses client currency if set and matching', () => {
    const client = { currency: 'EUR' }
    expect(resolveClientCurrency(client, [inv({ currency: 'EUR' })], 'USD')).toBe('EUR')
  })

  it('uses invoice currency if client currency is null', () => {
    const client = { currency: null }
    expect(resolveClientCurrency(client, [inv({ currency: 'IDR' })], 'MYR')).toBe('IDR')
  })

  it('falls back to invoice currency if client currency has no matching invoices', () => {
    const client = { currency: 'MYR' }
    expect(resolveClientCurrency(client, [inv({ currency: 'IDR' })], 'MYR')).toBe('IDR')
  })

  it('falls back to default currency if no invoices and client currency is null', () => {
    const client = { currency: null }
    expect(resolveClientCurrency(client, [], 'MYR')).toBe('MYR')
  })

  it('uses latest invoice currency when all invoices are paid', () => {
    const client = { currency: null }
    const invoices = [
      inv({ status: 'paid', currency: 'USD', issueDate: '2026-10-10' }),
      inv({ status: 'paid', currency: 'EUR', issueDate: '2026-10-20' }),
    ]
    expect(resolveClientCurrency(client, invoices, 'MYR')).toBe('EUR')
  })

  it('prefers unpaid invoice currency when available', () => {
    const client = { currency: null }
    const invoices = [
      inv({ status: 'paid', currency: 'MYR', issueDate: '2026-10-20' }),
      inv({ status: 'sent', currency: 'IDR', issueDate: '2026-10-15' }),
    ]
    expect(resolveClientCurrency(client, invoices, 'MYR')).toBe('IDR')
  })
})

describe('matchesClient', () => {
  const client = {
    name: 'Northwind Studio',
    contact: 'Jamie Rivera',
    email: 'billing@northwind.co',
  } as Client

  it('matches name, contact or email, ignoring case', () => {
    expect(matchesClient(client, 'north')).toBe(true)
    expect(matchesClient(client, 'JAMIE')).toBe(true)
    expect(matchesClient(client, 'billing@')).toBe(true)
    expect(matchesClient(client, 'acme')).toBe(false)
    expect(matchesClient(client, '  ')).toBe(true)
  })
})
