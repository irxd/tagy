import { beforeEach, describe, expect, it } from 'vitest'
import { createClient, listClients, setClientArchived, updateClient } from './clients'
import { db } from './db'
import {
  createInvoice,
  deleteInvoice,
  duplicateInvoice,
  isNumberTaken,
  getInvoice,
  listInvoices,
  restoreInvoice,
  updateInvoice,
} from './invoices'
import { getSettings, updateSettings } from './settings'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('settings', () => {
  it('returns defaults before anything is saved', async () => {
    const s = await getSettings()
    expect(s.prefix).toBe('INV-')
    expect(s.nextNumber).toBe(1)
    expect(await db.settings.count()).toBe(0)
  })

  it('merges a patch into the stored record', async () => {
    await updateSettings({ prefix: 'TG-', currency: 'EUR' })
    const s = await getSettings()
    expect(s.prefix).toBe('TG-')
    expect(s.currency).toBe('EUR')
    expect(s.terms).toBe('net14')
  })

  it('merges business fields instead of replacing the profile', async () => {
    await updateSettings({ business: { name: 'Tagy Studio', logoBlobId: 'logo' } })
    await updateSettings({ business: { email: 'hello@tagy.studio' } })
    const { business } = await getSettings()
    expect(business).toMatchObject({
      name: 'Tagy Studio',
      email: 'hello@tagy.studio',
      logoBlobId: 'logo',
    })
  })
})

describe('clients', () => {
  it('lists by name and hides archived clients unless asked', async () => {
    const b = await createClient({ name: 'Northwind Studio' })
    await createClient({ name: 'Acme Co.' })
    await setClientArchived(b.id, true)

    expect((await listClients()).map((c) => c.name)).toEqual(['Acme Co.'])
    expect((await listClients({ includeArchived: true })).map((c) => c.name)).toEqual([
      'Acme Co.',
      'Northwind Studio',
    ])
  })

  it('bumps updatedAt on update', async () => {
    const c = await createClient({ name: 'Lumen Bakery' })
    await new Promise((r) => setTimeout(r, 5))
    await updateClient(c.id, { email: 'orders@lumen.bakery' })
    const saved = await db.clients.get(c.id)
    expect(saved?.email).toBe('orders@lumen.bakery')
    expect(saved!.updatedAt > c.updatedAt).toBe(true)
  })
})

describe('invoices', () => {
  it('creates a draft with the next number and settings defaults', async () => {
    await updateSettings({ prefix: 'INV-', nextNumber: 42, terms: 'net14' })
    const inv = await createInvoice({ issueDate: '2026-10-16' })

    expect(inv.number).toBe('INV-0042')
    expect(inv.status).toBe('draft')
    expect(inv.dueDate).toBe('2026-10-30')
    expect((await getSettings()).nextNumber).toBe(43)
  })

  it('starts with the default tax rate, or none', async () => {
    expect(await createInvoice({})).toMatchObject({ taxPct: 0, applyTax: false })
    await updateSettings({ defaultTaxPct: 8 })
    expect(await createInvoice({})).toMatchObject({ taxPct: 8, applyTax: true })
  })

  it('takes currency and terms from the client', async () => {
    const client = await createClient({ name: 'Mono Ventures', currency: 'EUR', terms: 'net30' })
    const inv = await createInvoice({ clientId: client.id, issueDate: '2026-10-01' })
    expect(inv.currency).toBe('EUR')
    expect(inv.terms).toBe('net30')
    expect(inv.dueDate).toBe('2026-10-31')
  })

  it('never reuses a number after delete', async () => {
    const a = await createInvoice()
    await deleteInvoice(a.id)
    const b = await createInvoice()
    expect(a.number).toBe('INV-0001')
    expect(b.number).toBe('INV-0002')
  })

  it('skips numbers already taken by a hand-edited invoice', async () => {
    const a = await createInvoice()
    await updateInvoice(a.id, { number: 'INV-0002' })
    const b = await createInvoice()
    expect(b.number).toBe('INV-0003')
  })

  it('rejects a duplicate number', async () => {
    const a = await createInvoice()
    const b = await createInvoice()
    await expect(updateInvoice(b.id, { number: a.number })).rejects.toThrow()
  })

  it('restores a deleted invoice exactly (Undo)', async () => {
    const inv = await createInvoice()
    const removed = await deleteInvoice(inv.id)
    expect(await getInvoice(inv.id)).toBeUndefined()
    await restoreInvoice(removed!)
    expect(await getInvoice(inv.id)).toEqual(inv)
  })

  it('lists newest issue date first', async () => {
    await createInvoice({ issueDate: '2026-09-01' })
    await createInvoice({ issueDate: '2026-10-16' })
    const dates = (await listInvoices()).map((i) => i.issueDate)
    expect(dates).toEqual(['2026-10-16', '2026-09-01'])
  })

  it('duplicates as a fresh draft with copied items', async () => {
    const source = await createInvoice({
      status: 'paid',
      paidAt: '2026-10-20',
      items: [{ id: 'a', title: 'Logo', description: '', qty: 2, rate: 5_000 }],
      notes: 'Thanks',
    })
    const copy = await duplicateInvoice(source.id)
    expect(copy.number).not.toBe(source.number)
    expect(copy).toMatchObject({ status: 'draft', paidAt: null, notes: 'Thanks' })
    expect(copy.items[0]).toMatchObject({ title: 'Logo', qty: 2, rate: 5_000 })
    expect(copy.items[0]!.id).not.toBe('a')
    await expect(duplicateInvoice('missing')).rejects.toThrow()
  })

  it('checks whether a number is used by another invoice', async () => {
    const a = await createInvoice()
    expect(await isNumberTaken(a.number, a.id)).toBe(false)
    expect(await isNumberTaken(a.number, 'other')).toBe(true)
    expect(await isNumberTaken('INV-9999', a.id)).toBe(false)
  })
})
