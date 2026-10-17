import type { Page } from '@playwright/test'

/**
 * Writes records straight into the app's IndexedDB (database `tagy`), for
 * tests that need data the UI can't create yet. Call after the first page
 * load so Dexie has created the stores, then reload.
 */
export async function seed(page: Page, stores: Record<string, object[]>) {
  // Opening the database before Dexie does would create it without stores.
  await page.waitForFunction(async () =>
    (await indexedDB.databases()).some((d) => d.name === 'tagy'),
  )
  await page.evaluate(async (data) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('tagy')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const tx = db.transaction(Object.keys(data), 'readwrite')
    for (const [store, rows] of Object.entries(data)) {
      for (const row of rows) tx.objectStore(store).put(row)
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  }, stores)
}

const now = '2026-10-16T09:00:00.000Z'

export function client(id: string, name: string, email: string, patch: object = {}) {
  return {
    id,
    name,
    contact: '',
    email,
    address: '',
    taxId: '',
    currency: null,
    terms: null,
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

let n = 0
export function invoice(clientId: string, rate: number, patch: object = {}) {
  n++
  return {
    id: `inv-${n}`,
    number: `INV-${String(n).padStart(4, '0')}`,
    status: 'paid',
    clientId,
    issueDate: '2026-09-01',
    dueDate: '2099-01-01',
    terms: 'net14',
    currency: 'USD',
    items: [{ id: `l-${n}`, title: 'Work', description: '', qty: 1, rate }],
    discountPct: 0,
    taxRateId: null,
    applyTax: false,
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
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

/** The six clients from the Desktop · Clients board, with invoices behind their numbers. */
export function designClients() {
  return {
    clients: [
      client('ns', 'Northwind Studio', 'billing@northwind.co'),
      client('ac', 'Acme Co.', 'ap@acme.co'),
      client('hf', 'Harbor & Field', 'hello@harborfield.com'),
      client('lb', 'Lumen Bakery', 'orders@lumen.bakery'),
      client('mv', 'Mono Ventures', 'finance@mono.vc'),
      client('ok', 'Okta Kitchen', 'team@oktakitchen.com'),
      client('old', 'Old Client Ltd', 'old@client.co', { archived: true }),
    ],
    invoices: [
      invoice('ns', 6_420_000, { issueDate: '2026-10-01' }),
      invoice('ns', 1_200_000, { status: 'draft', issueDate: '2026-10-16' }),
      invoice('ac', 3_526_000, { issueDate: '2026-08-10' }),
      invoice('ac', 314_000, { status: 'sent', dueDate: '2026-10-12', issueDate: '2026-09-28' }),
      invoice('hf', 1_920_000, { issueDate: '2026-09-02' }),
      invoice('hf', 240_000, { status: 'sent', issueDate: '2026-10-02' }),
      invoice('lb', 860_000, { issueDate: '2026-09-10' }),
      invoice('lb', 86_000, { status: 'sent', issueDate: '2026-10-10' }),
      invoice('mv', 11_280_000, { issueDate: '2026-10-02' }),
      invoice('ok', 2_600_000, { issueDate: '2026-09-24' }),
    ],
  }
}
