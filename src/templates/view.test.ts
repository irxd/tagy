import { describe, expect, it } from 'vitest'
import { defaultSettings } from '@/db/defaults'
import type { AppSettings, Client, Invoice } from '@/db/types'
import { buildInvoiceView, PAGE_HEIGHT } from './view'

const settings: AppSettings = {
  ...defaultSettings(),
  business: { ...defaultSettings().business, name: 'Tagy Studio', email: 'hello@tagy.studio' },
  taxRates: [{ id: 't', name: 'Maine', pct: 8 }],
}

const client = {
  name: 'Northwind Studio',
  contact: '',
  email: 'billing@northwind.co',
  address: '',
  taxId: '',
} as Client

const invoice = {
  number: 'INV-0042',
  status: 'draft',
  issueDate: '2026-10-16',
  dueDate: '2026-10-30',
  currency: 'USD',
  items: [
    { id: 'a', title: 'Brand identity design', description: '', qty: 1, rate: 480_000 },
    { id: 'b', title: 'Website design & build', description: '', qty: 1, rate: 720_000 },
    { id: 'c', title: 'Strategy workshop', description: '', qty: 4, rate: 15_000 },
  ],
  discountPct: 5,
  taxRateId: 't',
  applyTax: true,
  showPaymentDetails: true,
  reference: 'PO-2026-118',
  notes: ' Thanks! ',
  paymentDetails: 'Bank transfer',
  paidAt: null,
  clientSnapshot: null,
  businessSnapshot: null,
  taxSnapshot: null,
} as unknown as Invoice

const view = (patch: Partial<Invoice> = {}, s: AppSettings = settings) =>
  buildInvoiceView({
    invoice: { ...invoice, ...patch },
    settings: s,
    client,
    logoUrl: null,
    today: '2026-10-16',
  })

describe('buildInvoiceView', () => {
  it('formats the design example', () => {
    const v = view()
    expect(v).toMatchObject({
      number: 'INV-0042',
      issued: '16 Oct, 2026',
      due: '30 Oct, 2026',
      dueNote: 'in 14 days',
      subtotal: '12,600.00',
      discount: { label: 'Discount (5%)', value: '−630.00' },
      tax: { label: 'Tax (8%)', value: '957.60' },
      total: '$12,927.60',
      totalAmount: '12,927.60',
      notes: 'Thanks!',
      paymentDetails: 'Bank transfer',
      accent: '#3D5AFE',
    })
    expect(v.lines[2]).toMatchObject({ qty: '4', rate: '150.00', amount: '600.00' })
    expect(v.client?.name).toBe('Northwind Studio')
  })

  it('describes the due date by status', () => {
    expect(view({ dueDate: '2026-10-17' }).dueNote).toBe('in 1 day')
    expect(view({ dueDate: '2026-10-16' }).dueNote).toBe('Due today')
    expect(view({ status: 'sent', dueDate: '2026-10-04' }).dueNote).toBe('12 days late')
    expect(view({ status: 'sent', dueDate: '2026-10-15' }).dueNote).toBe('1 day late')
    expect(view({ status: 'paid', paidAt: '2026-10-28' }).dueNote).toBe('Paid 28 Oct')
    expect(view({ status: 'paid', paidAt: null }).dueNote).toBe('Paid')
  })

  it('uses the snapshots of a sent invoice', () => {
    const v = view({
      clientSnapshot: { name: 'Old Name', contact: '', email: '', address: '', taxId: '' },
      businessSnapshot: {
        name: 'Old Studio',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        website: '',
      },
    })
    expect(v.client?.name).toBe('Old Name')
    expect(v.business.name).toBe('Old Studio')
  })

  it('hides empty or switched-off parts', () => {
    const v = view({ discountPct: 0, applyTax: false, showPaymentDetails: false, clientId: null })
    expect(v.discount).toBeNull()
    expect(v.tax).toBeNull()
    expect(v.paymentDetails).toBeNull()
    expect(
      buildInvoiceView({
        invoice: { ...invoice, paymentDetails: ' ' },
        settings,
        client: undefined,
        logoUrl: 'blob:x',
        today: '2026-10-16',
      }),
    ).toMatchObject({
      client: null,
      paymentDetails: null,
      show: { logo: true },
    })
  })

  it('knows the page heights', () => {
    expect(PAGE_HEIGHT).toEqual({ a4: 792, letter: 725 })
  })
})
