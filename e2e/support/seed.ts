import type { Page } from '@playwright/test'

/**
 * Writes records straight into the app's IndexedDB (database `tagy`), for
 * tests that need data the UI can't create yet. Call after the first page
 * load so Dexie has created the stores, then reload.
 */
export async function seed(page: Page, stores: Record<string, object[]>) {
  // Opening the database before Dexie has created its stores would fail, so
  // wait for the current schema (Dexie version 5 = IndexedDB version 50). Pages that
  // don't read data yet never open it, so call this from a page that does.
  await page.waitForFunction(async () =>
    (await indexedDB.databases()).some((d) => d.name === 'tagy' && (d.version ?? 0) >= 50),
  )
  await page.evaluate(async (data) => {
    const names = Object.keys(data)
    // The app may still be upgrading the schema; retry until every store exists.
    let db: IDBDatabase | undefined
    for (let attempt = 0; attempt < 50; attempt++) {
      const opened = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('tagy')
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      if (names.every((n) => opened.objectStoreNames.contains(n))) {
        db = opened
        break
      }
      opened.close()
      await new Promise((r) => setTimeout(r, 100))
    }
    if (!db) throw new Error('The app never created its database stores')
    const tx = db.transaction(names, 'readwrite')
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
    taxPct: 0,
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
    dateFormat: 'dd MMM, yyyy',
    businessOverride: null,
    clientSnapshot: null,
    businessSnapshot: null,
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

/** The six clients from the Desktop · Clients board, with invoices behind their numbers. */
export function designClients() {
  n = 0 // same ids and numbers (INV-0001…) on every call
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

/** Settings and business profile from the design (Tagy Studio, 8% tax). */
export function designSettings() {
  return {
    key: 'app',
    business: {
      name: 'Tagy Studio',
      logoBlobId: null,
      email: 'hello@tagy.studio',
      phone: '+1 (212) 555-0193',
      address: '221 Mercer St, New York, NY 10012',
      taxId: '47-3829105',
      website: 'tagy.studio',
      paymentDetails:
        'Bank transfer · Chase Bank\nAccount 000123454821 · Routing 021000021\nPlease use the invoice number as reference.',
    },
    prefix: 'INV-',
    nextNumber: 43,
    currency: 'USD',
    terms: 'net14',
    defaultTaxPct: 8,
    defaultTemplate: 'bold',
    accent: 'blue',
    fonts: { heading: 'template', body: 'template' },
    paper: 'a4',
    showFields: { logo: true, taxId: true, paymentDetails: true, signature: false },
    defaultNotes: 'Thank you for your business!',
    paymentDetailsByDefault: true,
    locale: 'en-US',
    dateFormat: 'dd MMM, yyyy',
    lastBackupAt: null,
  }
}

/** INV-0042 from the design: three items, 5% discount, 8% tax → $12,927.60. */
export function designInvoice(patch: object = {}) {
  return invoice('ns', 0, {
    id: 'inv-42',
    number: 'INV-0042',
    status: 'draft',
    issueDate: '2026-10-16',
    dueDate: '2026-10-30',
    items: [
      {
        id: 'a',
        title: 'Brand identity design',
        description: 'Logo, color system, typography',
        qty: 1,
        rate: 480_000,
      },
      {
        id: 'b',
        title: 'Website design & build',
        description: '8 responsive pages, CMS setup',
        qty: 1,
        rate: 720_000,
      },
      {
        id: 'c',
        title: 'Strategy workshop',
        description: 'Half-day remote session',
        qty: 4,
        rate: 15_000,
      },
    ],
    discountPct: 5,
    taxPct: 8,
    applyTax: true,
    reference: 'PO-2026-118',
    notes: 'Thank you for your business! Please include the invoice number with your payment.',
    paymentDetails: designSettings().business.paymentDetails,
    createdAt: '2026-10-16T09:00:00.000Z',
    ...patch,
  })
}
