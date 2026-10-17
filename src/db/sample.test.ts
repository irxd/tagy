import { beforeEach, describe, expect, it } from 'vitest'
import { displayStatus } from '@/domain/status'
import { createInvoice } from './invoices'
import { db } from './db'
import { addSampleData, clearSampleData, generateSampleData, hasSampleData } from './sample'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('sample data', () => {
  const today = '2026-10-18'

  it('makes 6 clients and 42 invoices over the last six months', () => {
    const { clients, invoices } = generateSampleData(today, 'USD', 'now')
    expect(clients).toHaveLength(6)
    expect(invoices).toHaveLength(42)
    expect(invoices.every((i) => i.issueDate >= '2026-04-18' && i.issueDate < today)).toBe(true)
    expect(invoices[0]!.number).toBe('DEMO-0001')
  })

  it('has every status, including overdue', () => {
    const statuses = new Set(
      generateSampleData(today, 'USD').invoices.map((i) => displayStatus(i, today)),
    )
    expect(statuses).toEqual(new Set(['draft', 'sent', 'overdue', 'paid']))
  })

  it('is the same every time', () => {
    expect(generateSampleData(today, 'USD', 'x')).toEqual(generateSampleData(today, 'USD', 'x'))
  })

  it('adds and clears without touching real records or numbering', async () => {
    const real = await createInvoice()
    await addSampleData(today, 'EUR')
    expect(await hasSampleData()).toBe(true)
    expect(await db.invoices.count()).toBe(43)

    await clearSampleData()
    expect(await hasSampleData()).toBe(false)
    expect(await db.invoices.toArray()).toEqual([real])
    expect(await db.clients.count()).toBe(0)
    expect((await createInvoice()).number).toBe('INV-0002')
  })
})
