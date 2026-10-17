import { dueDateFor, todayISO } from '@/domain/dates'
import { formatInvoiceNumber } from '@/domain/numbering'
import { db } from './db'
import { getSettings } from './settings'
import type { Invoice } from './types'

export type NewInvoice = Partial<Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'>>
export type InvoicePatch = Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>

/** All invoices, newest issue date first. */
export function listInvoices(): Promise<Invoice[]> {
  return db.invoices.orderBy('issueDate').reverse().toArray()
}

export function getInvoice(id: string): Promise<Invoice | undefined> {
  return db.invoices.get(id)
}

/**
 * Creates a Draft with the next invoice number and defaults from Settings
 * (and the client, when one is given). The number counter moves in the same
 * transaction and is never reused, even after the invoice is deleted.
 */
export function createInvoice(input: NewInvoice = {}): Promise<Invoice> {
  return db.transaction('rw', [db.invoices, db.settings, db.clients], async () => {
    const settings = await getSettings()
    const client = input.clientId ? await db.clients.get(input.clientId) : undefined

    // Skip numbers taken by hand-edited invoices.
    let n = settings.nextNumber
    while (
      (await db.invoices.where('number').equals(formatInvoiceNumber(settings.prefix, n)).count()) >
      0
    ) {
      n++
    }

    const now = new Date().toISOString()
    const terms = input.terms ?? client?.terms ?? settings.terms
    const issueDate = input.issueDate ?? todayISO()
    const invoice: Invoice = {
      status: 'draft',
      clientId: null,
      issueDate,
      dueDate: dueDateFor(issueDate, terms),
      terms,
      currency: client?.currency ?? settings.currency,
      items: [],
      discountPct: 0,
      taxPct: settings.defaultTaxPct,
      applyTax: settings.defaultTaxPct > 0,
      showPaymentDetails: settings.paymentDetailsByDefault,
      reference: '',
      notes: settings.defaultNotes,
      paymentDetails: settings.business.paymentDetails,
      templateId: settings.defaultTemplate,
      sentAt: null,
      paidAt: null,
      paidMethod: '',
      paidNote: '',
      clientSnapshot: null,
      businessSnapshot: null,
      ...input,
      id: crypto.randomUUID(),
      number: formatInvoiceNumber(settings.prefix, n),
      createdAt: now,
      updatedAt: now,
    }

    await db.invoices.add(invoice)
    await db.settings.put({ ...settings, nextNumber: n + 1 })
    return invoice
  })
}

export async function updateInvoice(id: string, patch: InvoicePatch): Promise<void> {
  await db.invoices.update(id, { ...patch, updatedAt: new Date().toISOString() })
}

/** Hard delete. Returns the removed record so a toast can offer Undo. */
export async function deleteInvoice(id: string): Promise<Invoice | undefined> {
  return db.transaction('rw', db.invoices, async () => {
    const invoice = await db.invoices.get(id)
    if (invoice) await db.invoices.delete(id)
    return invoice
  })
}

/** Puts a deleted invoice back exactly as it was (Undo). */
export async function restoreInvoice(invoice: Invoice): Promise<void> {
  await db.invoices.put(invoice)
}

/**
 * Duplicate: a new Draft with the same client, items and texts, the next
 * number and today's dates. Status, payment and snapshots start fresh.
 */
export async function duplicateInvoice(id: string): Promise<Invoice> {
  const source = await db.invoices.get(id)
  if (!source) throw new Error(`Invoice ${id} not found`)
  return createInvoice({
    clientId: source.clientId,
    terms: source.terms,
    currency: source.currency,
    items: source.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    discountPct: source.discountPct,
    taxPct: source.taxPct,
    applyTax: source.applyTax,
    showPaymentDetails: source.showPaymentDetails,
    reference: source.reference,
    notes: source.notes,
    paymentDetails: source.paymentDetails,
    templateId: source.templateId,
  })
}

/** True when another invoice already uses this number (numbers are unique). */
export async function isNumberTaken(number: string, exceptId: string): Promise<boolean> {
  const match = await db.invoices.where('number').equals(number).first()
  return !!match && match.id !== exceptId
}
