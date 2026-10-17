import { describe, expect, it } from 'vitest'
import { defaultSettings } from '@/db/defaults'
import type { Client, Invoice } from '@/db/types'
import {
  backToDraft,
  daysLate,
  displayStatus,
  isUnpaid,
  markPaid,
  markSent,
  undoPaid,
} from './status'

const invoice = (patch: Partial<Invoice> = {}): Invoice => ({
  id: 'i1',
  number: 'INV-0042',
  status: 'draft',
  clientId: 'c1',
  issueDate: '2026-10-16',
  dueDate: '2026-10-30',
  terms: 'net14',
  currency: 'USD',
  items: [],
  discountPct: 0,
  taxRateId: 't1',
  applyTax: true,
  showPaymentDetails: true,
  reference: '',
  notes: '',
  paymentDetails: '',
  templateId: 'bold',
  sentAt: null,
  paidAt: null,
  paidMethod: '',
  paidNote: '',
  clientSnapshot: null,
  businessSnapshot: null,
  taxSnapshot: null,
  createdAt: '2026-10-16T09:00:00.000Z',
  updatedAt: '2026-10-16T09:00:00.000Z',
  ...patch,
})

const client: Client = {
  id: 'c1',
  name: 'Northwind Studio',
  contact: 'Jamie Rivera',
  email: 'billing@northwind.co',
  address: '1 Main St',
  taxId: '',
  currency: null,
  terms: null,
  archived: false,
  createdAt: '',
  updatedAt: '',
}

describe('displayStatus', () => {
  it('derives Overdue from Sent past its due date', () => {
    const sent = invoice({ status: 'sent' })
    expect(displayStatus(sent, '2026-10-30')).toBe('sent') // due today is not late
    expect(displayStatus(sent, '2026-10-31')).toBe('overdue')
  })

  it('never marks drafts or paid invoices overdue', () => {
    expect(displayStatus(invoice({ status: 'draft' }), '2027-01-01')).toBe('draft')
    expect(displayStatus(invoice({ status: 'paid' }), '2027-01-01')).toBe('paid')
  })

  it('counts days late', () => {
    expect(daysLate(invoice({ status: 'sent' }), '2026-11-11')).toBe(12)
    expect(daysLate(invoice({ status: 'sent' }), '2026-10-20')).toBe(0)
    expect(daysLate(invoice({ status: 'paid' }), '2026-11-11')).toBe(0)
  })

  it('treats only Sent as unpaid', () => {
    expect(isUnpaid(invoice({ status: 'sent' }))).toBe(true)
    expect(isUnpaid(invoice({ status: 'draft' }))).toBe(false)
    expect(isUnpaid(invoice({ status: 'paid' }))).toBe(false)
  })
})

describe('transitions', () => {
  const business = { ...defaultSettings().business, name: 'Tagy Studio' }
  const now = '2026-10-16T10:00:00.000Z'
  const taxRate = { id: 't1', name: 'Maine', pct: 8 }

  it('Draft → Sent sets sentAt and freezes client, business and tax', () => {
    const patch = markSent(invoice(), { now, client, business, taxRate })
    expect(patch).toMatchObject({
      status: 'sent',
      sentAt: now,
      clientSnapshot: { name: 'Northwind Studio', email: 'billing@northwind.co' },
      businessSnapshot: { name: 'Tagy Studio' },
      taxSnapshot: { name: 'Maine', pct: 8 },
    })
  })

  it('skips the tax snapshot when tax is off, and the client one with no client', () => {
    const patch = markSent(invoice({ applyTax: false, clientId: null }), {
      now,
      client: undefined,
      business,
      taxRate,
    })
    expect(patch.taxSnapshot).toBeNull()
    expect(patch.clientSnapshot).toBeNull()
  })

  it('Sent → Draft clears sentAt and snapshots', () => {
    expect(backToDraft(invoice({ status: 'sent', sentAt: now }))).toEqual({
      status: 'draft',
      sentAt: null,
      clientSnapshot: null,
      businessSnapshot: null,
      taxSnapshot: null,
    })
  })

  it('Sent → Paid records the payment, Undo clears it', () => {
    const paid = markPaid(invoice({ status: 'sent' }), {
      paidAt: '2026-10-28',
      method: 'Bank transfer',
      note: 'ref INV-0042',
    })
    expect(paid).toEqual({
      status: 'paid',
      paidAt: '2026-10-28',
      paidMethod: 'Bank transfer',
      paidNote: 'ref INV-0042',
    })
    expect(undoPaid(invoice({ status: 'paid' }))).toEqual({
      status: 'sent',
      paidAt: null,
      paidMethod: '',
      paidNote: '',
    })
  })

  it('refuses transitions from the wrong status', () => {
    expect(() => markSent(invoice({ status: 'paid' }), { now, client, business, taxRate })).toThrow(
      'INV-0042 is paid, expected draft',
    )
    expect(() => markPaid(invoice(), { paidAt: '', method: '', note: '' })).toThrow()
    expect(() => backToDraft(invoice())).toThrow()
    expect(() => undoPaid(invoice({ status: 'sent' }))).toThrow()
  })
})
