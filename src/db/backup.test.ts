import { beforeEach, describe, expect, it } from 'vitest'
import {
  BackupError,
  createBackup,
  markBackedUp,
  parseBackup,
  restoreBackup,
  SCHEMA_VERSION,
} from './backup'
import { createClient } from './clients'
import { db } from './db'
import { createInvoice } from './invoices'
import { getSettings, updateSettings } from './settings'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

async function sampleData() {
  await updateSettings({ business: { name: 'Tagy Studio' }, nextNumber: 42 })
  const client = await createClient({ name: 'Northwind Studio', currency: 'EUR' })
  await createInvoice({
    clientId: client.id,
    items: [{ id: 'a', title: 'Design', description: '', qty: 1.5, rate: 480_000 }],
  })
  await db.blobs.put({
    id: 'logo',
    type: 'image/png',
    data: new Blob([new Uint8Array([1, 2, 3, 250])]),
  })
}

describe('backup', () => {
  it('round-trips every store through JSON', async () => {
    await sampleData()
    const before = {
      invoices: await db.invoices.toArray(),
      clients: await db.clients.toArray(),
    }
    const file = await createBackup('2026-10-18T10:00:00.000Z')
    const text = JSON.stringify(file)

    await Promise.all(db.tables.map((t) => t.clear()))
    const parsed = parseBackup(text)
    expect(parsed.summary).toEqual({
      invoices: 1,
      clients: 1,
      exportedAt: '2026-10-18T10:00:00.000Z',
      business: 'Tagy Studio',
    })
    await restoreBackup(parsed.file)

    expect(await db.invoices.toArray()).toEqual(before.invoices)
    expect(await db.clients.toArray()).toEqual(before.clients)
    const settings = await getSettings()
    expect(settings.nextNumber).toBe(43)
    expect(settings.lastBackupAt).toBe('2026-10-18T10:00:00.000Z')
    const logo = await db.blobs.get('logo')
    expect(new Uint8Array(await logo!.data.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 250]))
  })

  it('writes the current schema version', async () => {
    expect((await createBackup()).schemaVersion).toBe(SCHEMA_VERSION)
    expect((await createBackup()).data.settings).toBeNull()
  })

  it('records when a backup was saved', async () => {
    await updateSettings({ prefix: 'INV-' })
    await markBackedUp('2026-10-18T10:00:00.000Z')
    expect((await getSettings()).lastBackupAt).toBe('2026-10-18T10:00:00.000Z')
  })

  it('rejects files that are not backups, newer, or damaged', async () => {
    expect(() => parseBackup('not json')).toThrow(BackupError)
    expect(() => parseBackup('{"hello":1}')).toThrow("isn't a Tagy backup")
    expect(() => parseBackup(JSON.stringify({ app: 'tagy', schemaVersion: 99 }))).toThrow(
      'newer version',
    )
    expect(() => parseBackup(JSON.stringify({ app: 'tagy', schemaVersion: 0, data: {} }))).toThrow(
      "can't be upgraded",
    )

    await sampleData()
    const file = await createBackup()
    ;(file.data.invoices[0] as unknown as { status: string }).status = 'lost'
    expect(() => parseBackup(JSON.stringify(file))).toThrow(/damaged \(data\.invoices\.0\.status/)
  })

  it('a failed restore leaves existing data alone', async () => {
    await sampleData()
    const file = await createBackup()
    file.data.invoices.push(file.data.invoices[0]!) // duplicate id → bulkAdd fails
    await expect(restoreBackup(file)).rejects.toThrow()
    expect(await db.invoices.count()).toBe(1)
    expect(await db.clients.count()).toBe(1)
  })
})
