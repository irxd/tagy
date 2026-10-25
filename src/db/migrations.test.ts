import { Dexie } from 'dexie'
import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup } from './backup'
import { db, TagyDB } from './db'
import { createInvoice } from './invoices'
import { updateSettings } from './settings'

const rates = [{ id: 'maine', name: 'Maine', pct: 8 }]

/** v1 invoices: a draft on the Settings rate, a sent one with a frozen rate, one without tax. */
const v1Invoices = [
  { id: 'draft', number: 'INV-1', applyTax: true, taxRateId: 'maine', taxSnapshot: null },
  {
    id: 'sent',
    number: 'INV-2',
    applyTax: true,
    taxRateId: 'gone',
    taxSnapshot: { name: 'Old', pct: 5 },
  },
  { id: 'none', number: 'INV-3', applyTax: false, taxRateId: null, taxSnapshot: null },
]
const v1Settings = { key: 'app', taxRates: rates, defaultTaxRateId: 'maine' }

describe('v1 → v2: tax moves onto each invoice', () => {
  it('upgrades the browser database', async () => {
    const name = 'tagy-migrate-test'
    const old = new Dexie(name)
    old.version(1).stores({
      invoices: 'id, &number, status, clientId, issueDate, dueDate, updatedAt',
      clients: 'id, name',
      settings: 'key',
      blobs: 'id',
    })
    await old.table('invoices').bulkAdd(v1Invoices)
    await old.table('settings').put(v1Settings)
    old.close()

    const upgraded = new TagyDB(name)
    const invoices = await upgraded.invoices.orderBy('number').toArray()
    expect(invoices.map((i) => [i.id, i.taxPct, i.applyTax])).toEqual([
      ['draft', 8, true],
      ['sent', 5, true],
      ['none', 0, false],
    ])
    expect(invoices[0]).not.toHaveProperty('taxRateId')
    expect(invoices[1]).not.toHaveProperty('taxSnapshot')
    const settings = await upgraded.settings.get('app')
    expect(settings).toEqual({ key: 'app', defaultTaxPct: 8 })
    upgraded.close()
    await Dexie.delete(name)
  })

  it('imports a v1 backup file', async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    await updateSettings({ business: { name: 'Tagy Studio' } })
    await createInvoice({})
    const v2 = await createBackup()
    const { taxPct: _, ...invoice } = v2.data.invoices[0]!
    const { defaultTaxPct: __, ...settings } = v2.data.settings!
    const v1 = {
      ...v2,
      schemaVersion: 1,
      data: {
        ...v2.data,
        invoices: [{ ...invoice, applyTax: true, taxRateId: 'maine', taxSnapshot: null }],
        settings: { ...settings, taxRates: rates, defaultTaxRateId: 'maine' },
      },
    }

    const { file } = parseBackup(JSON.stringify(v1))
    expect(file.schemaVersion).toBe(3)
    expect(file.data.invoices[0]).toMatchObject({ taxPct: 8, applyTax: true })
    expect(file.data.invoices[0]).not.toHaveProperty('taxRateId')
    expect(file.data.settings).toMatchObject({ defaultTaxPct: 8 })
    expect(file.data.settings).not.toHaveProperty('taxRates')
  })
})

describe('v2 → v3: the Font setting names a font', () => {
  it('upgrades the browser database', async () => {
    const name = 'tagy-migrate-fonts-test'
    const old = new Dexie(name)
    old.version(2).stores({
      invoices: 'id, &number, status, clientId, issueDate, dueDate, updatedAt',
      clients: 'id, name',
      settings: 'key',
      blobs: 'id',
    })
    await old.table('settings').put({ key: 'app', font: 'serif' })
    old.close()

    const upgraded = new TagyDB(name)
    expect(await upgraded.settings.get('app')).toEqual({ key: 'app', font: 'newsreader' })
    upgraded.close()
    await Dexie.delete(name)
  })

  it('imports a v2 backup file', async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    await updateSettings({ business: { name: 'Tagy Studio' } })
    const v3 = await createBackup()
    for (const [old, font] of [
      ['sans', 'template'],
      ['serif', 'newsreader'],
      ['mono', 'geist-mono'],
    ]) {
      const v2 = {
        ...v3,
        schemaVersion: 2,
        data: { ...v3.data, settings: { ...v3.data.settings, font: old } },
      }
      const { file } = parseBackup(JSON.stringify(v2))
      expect(file.schemaVersion).toBe(3)
      expect(file.data.settings?.font).toBe(font)
    }
  })
})
