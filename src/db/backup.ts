import { z } from 'zod'
import { base64ToBlob, blobToBase64 } from '@/lib/base64'
import { db } from './db'
import { invoiceV1toV2, settingsV1toV2, settingsV2toV3, taxRatesV1 } from './migrations'
import type { AppSettings, Client, Invoice, StoredBlob } from './types'

/*
 * JSON backup: one file with every store and a schemaVersion. Import
 * validates the whole file, runs migrations from its version, then
 * replaces all data in one transaction — a failed import changes nothing.
 */

export const SCHEMA_VERSION = 3

export class BackupError extends Error {}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const money = z.number().int()
const terms = z.enum(['receipt', 'net7', 'net14', 'net30'])
const template = z.enum(['minimal', 'classic', 'bold', 'studio'])

const lineItem = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  qty: z.number().nonnegative(),
  rate: money,
})

const business = z.object({
  name: z.string(),
  logoBlobId: z.string().nullable(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  taxId: z.string(),
  website: z.string(),
  paymentDetails: z.string(),
})

const clientSnapshot = z.object({
  name: z.string(),
  contact: z.string(),
  email: z.string(),
  address: z.string(),
  taxId: z.string(),
})

const invoiceSchema: z.ZodType<Invoice> = z.object({
  id: z.string(),
  number: z.string().min(1),
  status: z.enum(['draft', 'sent', 'paid']),
  clientId: z.string().nullable(),
  issueDate: isoDate,
  dueDate: isoDate,
  terms,
  currency: z.string().length(3),
  items: z.array(lineItem),
  discountPct: z.number().min(0).max(100),
  taxPct: z.number().min(0).max(100),
  applyTax: z.boolean(),
  showPaymentDetails: z.boolean(),
  reference: z.string(),
  notes: z.string(),
  paymentDetails: z.string(),
  templateId: template,
  sentAt: z.string().nullable(),
  paidAt: isoDate.nullable(),
  paidMethod: z.string(),
  paidNote: z.string(),
  clientSnapshot: clientSnapshot.nullable(),
  businessSnapshot: business.omit({ logoBlobId: true, paymentDetails: true }).nullable(),
  sample: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const clientSchema: z.ZodType<Client> = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  email: z.string(),
  address: z.string(),
  taxId: z.string(),
  currency: z.string().length(3).nullable(),
  terms: terms.nullable(),
  archived: z.boolean(),
  sample: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const settingsSchema: z.ZodType<AppSettings> = z.object({
  key: z.literal('app'),
  business,
  prefix: z.string(),
  nextNumber: z.number().int().min(1),
  currency: z.string().length(3),
  terms,
  defaultTaxPct: z.number().min(0).max(100),
  defaultTemplate: template,
  accent: z.enum(['blue', 'ink', 'green', 'orange', 'pink', 'violet']),
  font: z.enum([
    'template',
    'geist',
    'inter-tight',
    'dm-sans',
    'newsreader',
    'source-serif-4',
    'instrument-serif',
    'geist-mono',
    'dm-mono',
    'space-mono',
  ]),
  paper: z.enum(['a4', 'letter']),
  showFields: z.object({
    logo: z.boolean(),
    taxId: z.boolean(),
    paymentDetails: z.boolean(),
    signature: z.boolean(),
  }),
  defaultNotes: z.string(),
  paymentDetailsByDefault: z.boolean(),
  locale: z.string(),
  dateFormat: z.string(),
  lastBackupAt: z.string().nullable(),
})

const fileSchema = z.object({
  app: z.literal('tagy'),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  data: z.object({
    invoices: z.array(invoiceSchema),
    clients: z.array(clientSchema),
    settings: settingsSchema.nullable(),
    blobs: z.array(z.object({ id: z.string(), type: z.string(), base64: z.string() })),
  }),
})

export type BackupFile = z.infer<typeof fileSchema>

/**
 * Upgrades a file's raw data from an older schemaVersion to the current
 * one. Each future version adds a step here; the same steps also run as
 * Dexie upgrades in the browser.
 */
const migrations: Record<number, (data: unknown) => unknown> = {
  1: (data) => {
    const d = data as { invoices?: unknown; settings?: Record<string, unknown> | null }
    const rates = taxRatesV1(d.settings ?? undefined)
    return {
      ...d,
      invoices: Array.isArray(d.invoices)
        ? d.invoices.map((inv: Record<string, unknown>) => invoiceV1toV2(inv, rates))
        : d.invoices,
      settings: d.settings ? settingsV1toV2(d.settings) : d.settings,
    }
  },
  2: (data) => {
    const d = data as { settings?: Record<string, unknown> | null }
    return { ...d, settings: d.settings ? settingsV2toV3(d.settings) : d.settings }
  },
}

function migrate(raw: { schemaVersion: number; data: unknown }): unknown {
  let data = raw.data
  for (let v = raw.schemaVersion; v < SCHEMA_VERSION; v++) {
    const step = migrations[v]
    if (!step) throw new BackupError(`This backup's format (v${v}) can't be upgraded.`)
    data = step(data)
  }
  return data
}

export async function createBackup(now = new Date().toISOString()): Promise<BackupFile> {
  // Read in one transaction for a consistent snapshot; encode the blobs
  // afterwards, since awaiting non-database work would end the transaction.
  const [invoices, clients, settings, blobs] = await db.transaction('r', db.tables, () =>
    Promise.all([
      db.invoices.toArray(),
      db.clients.toArray(),
      db.settings.get('app'),
      db.blobs.toArray(),
    ]),
  )
  return {
    app: 'tagy' as const,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    data: {
      invoices,
      clients,
      settings: settings ? { ...settings, lastBackupAt: now } : null,
      blobs: await Promise.all(
        blobs.map(async (b) => ({ id: b.id, type: b.type, base64: await blobToBase64(b.data) })),
      ),
    },
  }
}

/** Records that a backup was saved (drives "Last backup …" and the reminder). */
export async function markBackedUp(at: string): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const settings = await db.settings.get('app')
    if (settings) await db.settings.put({ ...settings, lastBackupAt: at })
  })
}

export interface ParsedBackup {
  file: BackupFile
  summary: { invoices: number; clients: number; exportedAt: string; business: string }
}

/** Reads and validates a backup file's text. Throws BackupError with a readable reason. */
export function parseBackup(text: string): ParsedBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupError("This file isn't a Tagy backup (it isn't valid JSON).")
  }
  const head = z.object({ app: z.literal('tagy'), schemaVersion: z.number().int() }).safeParse(json)
  if (!head.success) throw new BackupError("This file isn't a Tagy backup.")
  if (head.data.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError(
      'This backup was made by a newer version of Tagy. Reload the app and try again.',
    )
  }
  const raw = json as { schemaVersion: number; data: unknown }
  const result = fileSchema.safeParse({
    ...(json as object),
    schemaVersion: SCHEMA_VERSION,
    data: migrate(raw),
  })
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new BackupError(
      `This backup looks damaged${issue ? ` (${issue.path.join('.')}: ${issue.message})` : ''}.`,
    )
  }
  const file = result.data
  return {
    file,
    summary: {
      invoices: file.data.invoices.length,
      clients: file.data.clients.length,
      exportedAt: file.exportedAt,
      business: file.data.settings?.business.name ?? '',
    },
  }
}

/** Replaces everything in this browser with the backup, in one transaction. */
export async function restoreBackup(file: BackupFile): Promise<void> {
  const blobs: StoredBlob[] = file.data.blobs.map((b) => ({
    id: b.id,
    type: b.type,
    data: base64ToBlob(b.base64, b.type),
  }))
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.invoices.bulkAdd(file.data.invoices)
    await db.clients.bulkAdd(file.data.clients)
    if (file.data.settings) await db.settings.put(file.data.settings)
    await db.blobs.bulkAdd(blobs)
  })
}
