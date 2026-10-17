import { db } from './db'
import { updateSettings } from './settings'

const LOGO_ID = 'logo'

/** Stores the business logo and points the profile at it. */
export async function saveLogo(png: Blob): Promise<void> {
  await db.transaction('rw', [db.blobs, db.settings], async () => {
    await db.blobs.put({ id: LOGO_ID, type: png.type, data: png })
    await updateSettings({ business: { logoBlobId: LOGO_ID } })
  })
}

export async function removeLogo(): Promise<void> {
  await db.transaction('rw', [db.blobs, db.settings], async () => {
    await db.blobs.delete(LOGO_ID)
    await updateSettings({ business: { logoBlobId: null } })
  })
}

/** Settings → Clear all data. Empties every store; the app starts fresh. */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}

export async function countRecords(): Promise<{ invoices: number; clients: number }> {
  const [invoices, clients] = await Promise.all([db.invoices.count(), db.clients.count()])
  return { invoices, clients }
}
