import { trackSave } from '@/app/saveStatus'
import { getClient } from '@/db/clients'
import { db } from '@/db/db'
import {
  deleteInvoice,
  duplicateInvoice,
  getInvoice,
  restoreInvoice,
  updateInvoice,
} from '@/db/invoices'
import { getSettings } from '@/db/settings'
import type { Invoice } from '@/db/types'
import { todayISO } from '@/domain/dates'
import { backToDraft, markPaid, markSent, undoPaid, type Payment } from '@/domain/status'
import { downloadInvoice, type DownloadFormat } from '@/pdf/download'
import { buildInvoiceView } from '@/templates/view'

/*
 * Invoice actions that work from an id, for lists (Overview rows) where no
 * editor is open. Each loads what it needs, applies the domain rule and
 * writes once. The editor has its own versions that use its in-memory edits.
 */

async function load(id: string): Promise<Invoice> {
  const invoice = await getInvoice(id)
  if (!invoice) throw new Error(`Invoice ${id} not found`)
  return invoice
}

export async function sendInvoice(id: string): Promise<Invoice> {
  const invoice = await load(id)
  const settings = await getSettings()
  const client = invoice.clientId ? await getClient(invoice.clientId) : undefined
  const patch = markSent(invoice, {
    now: new Date().toISOString(),
    client,
    business: settings.business,
  })
  await trackSave(updateInvoice(id, patch))
  return invoice
}

/** Returns the invoice as it was, for Undo. */
export async function payInvoice(id: string, payment: Payment): Promise<Invoice> {
  const invoice = await load(id)
  await trackSave(updateInvoice(id, markPaid(invoice, payment)))
  return invoice
}

export async function unpayInvoice(id: string): Promise<void> {
  await trackSave(updateInvoice(id, undoPaid(await load(id))))
}

export async function draftInvoice(id: string): Promise<void> {
  await trackSave(updateInvoice(id, backToDraft(await load(id))))
}

export { deleteInvoice, duplicateInvoice, restoreInvoice }

/** Builds the invoice's view from the database and downloads it as a PDF or PNG. */
export async function downloadInvoiceById(
  id: string,
  format: DownloadFormat = 'pdf',
): Promise<void> {
  const invoice = await load(id)
  const settings = await getSettings()
  const client = invoice.clientId ? await getClient(invoice.clientId) : undefined
  const logo = settings.business.logoBlobId
    ? await db.blobs.get(settings.business.logoBlobId)
    : undefined
  const logoUrl = logo ? URL.createObjectURL(logo.data) : null
  try {
    const view = buildInvoiceView({ invoice, settings, client, logoUrl, today: todayISO() })
    await downloadInvoice(view, invoice.templateId, format)
  } finally {
    if (logoUrl) URL.revokeObjectURL(logoUrl)
  }
}
