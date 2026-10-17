import { describe, expect, it } from 'vitest'
import type { Client, Invoice } from '@/db/types'
import { clientStats, matchesClient } from './clients'
import { invoiceTaxPct, invoiceTotal } from './totals'

const today = '2026-10-18'
const rates = [{ id: 't', name: 'Tax', pct: 10 }]

const inv = (patch: Partial<Invoice>): Invoice =>
  ({
    status: 'sent',
    issueDate: '2026-10-01',
    dueDate: '2026-10-30',
    currency: 'USD',
    items: [{ id: 'l', title: 'Work', description: '', qty: 1, rate: 10_000 }],
    discountPct: 0,
    applyTax: false,
    taxRateId: null,
    taxSnapshot: null,
    ...patch,
  }) as Invoice

describe('invoice totals', () => {
  it('uses no tax when Apply tax is off', () => {
    expect(invoiceTaxPct(inv({ applyTax: false, taxRateId: 't' }), rates)).toBeNull()
  })

  it('prefers the frozen tax over the current rate', () => {
    const sent = inv({ applyTax: true, taxRateId: 't', taxSnapshot: { name: 'Old', pct: 5 } })
    expect(invoiceTaxPct(sent, rates)).toBe(5)
    expect(invoiceTotal(sent, rates)).toBe(10_500)
  })

  it('falls back to the current rate, or none if it was deleted', () => {
    expect(invoiceTaxPct(inv({ applyTax: true, taxRateId: 't' }), rates)).toBe(10)
    expect(invoiceTaxPct(inv({ applyTax: true, taxRateId: 'gone' }), rates)).toBeNull()
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
      rates,
      today,
    )
    expect(stats).toEqual({
      invoiceCount: 3,
      billed: 30_000,
      unpaid: 20_000,
      overdue: 10_000,
      lastIssueDate: '2026-10-16',
      hint: 'overdue',
    })
  })

  it('leaves drafts and other currencies out of the amounts', () => {
    const stats = clientStats(
      [inv({ status: 'draft' }), inv({ status: 'sent', currency: 'EUR' })],
      'USD',
      rates,
      today,
    )
    expect(stats).toMatchObject({ invoiceCount: 2, billed: 0, unpaid: 0, hint: 'draft' })
  })

  it('picks the hint by priority', () => {
    expect(clientStats([inv({ status: 'sent' })], 'USD', rates, today).hint).toBe('unpaid')
    expect(clientStats([inv({ status: 'paid' })], 'USD', rates, today).hint).toBe('paid')
    expect(clientStats([], 'USD', rates, today)).toMatchObject({ hint: 'new', lastIssueDate: null })
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
