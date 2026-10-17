import type { Business, Client, ISODate, ISODateTime, Invoice, InvoiceStatus } from '@/db/types'
import { daysBetween } from './dates'

/** What the UI shows. Overdue is never stored: it is Sent past its due date. */
export type DisplayStatus = InvoiceStatus | 'overdue'

export function displayStatus(
  invoice: Pick<Invoice, 'status' | 'dueDate'>,
  today: ISODate,
): DisplayStatus {
  return invoice.status === 'sent' && invoice.dueDate < today ? 'overdue' : invoice.status
}

/** Days past due (positive) for an overdue invoice, else 0. */
export function daysLate(invoice: Pick<Invoice, 'status' | 'dueDate'>, today: ISODate): number {
  return displayStatus(invoice, today) === 'overdue' ? daysBetween(invoice.dueDate, today) : 0
}

/** Draft and Sent (incl. overdue) count as unpaid; Paid does not. */
export function isUnpaid(invoice: Pick<Invoice, 'status'>): boolean {
  return invoice.status === 'sent'
}

type StatusPatch = Partial<Invoice>

export interface SendContext {
  now: ISODateTime
  client: Client | undefined
  business: Business
}

/**
 * Draft → Sent. Freezes client and business so later edits elsewhere don't
 * rewrite it. Tax needs no freezing: the invoice holds its own rate.
 */
export function markSent(invoice: Invoice, ctx: SendContext): StatusPatch {
  assertStatus(invoice, 'draft')
  const { client, business } = ctx
  return {
    status: 'sent',
    sentAt: ctx.now,
    clientSnapshot: client
      ? {
          name: client.name,
          contact: client.contact,
          email: client.email,
          address: client.address,
          taxId: client.taxId,
        }
      : null,
    businessSnapshot: {
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      taxId: business.taxId,
      website: business.website,
    },
  }
}

/** Sent → Draft ("Back to draft"). Clears sentAt and the snapshots. */
export function backToDraft(invoice: Invoice): StatusPatch {
  assertStatus(invoice, 'sent')
  return {
    status: 'draft',
    sentAt: null,
    clientSnapshot: null,
    businessSnapshot: null,
  }
}

export interface Payment {
  paidAt: ISODate
  method: string
  note: string
}

/** Sent → Paid (Mark as paid dialog / sheet). */
export function markPaid(invoice: Invoice, payment: Payment): StatusPatch {
  assertStatus(invoice, 'sent')
  return {
    status: 'paid',
    paidAt: payment.paidAt,
    paidMethod: payment.method,
    paidNote: payment.note,
  }
}

/** Paid → Sent (Undo). Clears the payment fields. */
export function undoPaid(invoice: Invoice): StatusPatch {
  assertStatus(invoice, 'paid')
  return { status: 'sent', paidAt: null, paidMethod: '', paidNote: '' }
}

function assertStatus(invoice: Invoice, expected: InvoiceStatus) {
  if (invoice.status !== expected) {
    throw new Error(`${invoice.number} is ${invoice.status}, expected ${expected}`)
  }
}
