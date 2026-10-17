import { describe, expect, it } from 'vitest'
import type { Invoice } from '@/db/types'
import { invoicesToCsv } from './csv'

const invoice = {
  number: 'INV-0042',
  status: 'paid',
  issueDate: '2026-10-16',
  dueDate: '2026-10-30',
  currency: 'USD',
  items: [{ id: 'a', title: 'Design', description: '', qty: 1, rate: 1_260_000 }],
  discountPct: 5,
  applyTax: true,
  taxPct: 8,
  paidAt: '2026-10-28',
  paidMethod: 'Bank transfer',
  reference: 'PO "118", rush',
} as unknown as Invoice

describe('invoicesToCsv', () => {
  it('writes a header and one row per invoice with plain amounts', () => {
    const csv = invoicesToCsv([invoice], () => 'Northwind Studio', '2026-10-31')
    const [header, row] = csv.trim().split('\r\n')
    expect(header).toBe(
      'Number,Status,Client,Issue date,Due date,Currency,Subtotal,Discount,Tax,Total,Paid on,Payment method,Reference',
    )
    expect(row).toBe(
      'INV-0042,paid,Northwind Studio,2026-10-16,2026-10-30,USD,12600.00,630.00,957.60,12927.60,2026-10-28,Bank transfer,"PO ""118"", rush"',
    )
  })

  it('marks overdue and leaves empty fields blank', () => {
    const open = {
      ...invoice,
      status: 'sent',
      paidAt: null,
      paidMethod: '',
      reference: '',
    } as Invoice
    const row = invoicesToCsv([open], () => 'Acme, Inc.\nLondon', '2026-11-02')
      .trim()
      .split('\r\n')
      .slice(1)
      .join('\n')
    expect(row).toContain('overdue,"Acme, Inc.\nLondon"')
    expect(row.endsWith(',,,')).toBe(true)
  })
})
