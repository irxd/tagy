import type { AppSettings, Client, Invoice } from '@/db/types'
import { addDays, todayISO } from '@/domain/dates'

/**
 * The design's INV-0042, used to preview templates before any invoice
 * exists. The user's own business details are used when they've set them.
 */
export function sampleInvoice(settings: AppSettings): { invoice: Invoice; client: Client } {
  const today = todayISO()
  const now = new Date().toISOString()
  const client: Client = {
    id: 'sample-client',
    name: 'Northwind Studio',
    contact: 'Dana Whitfield',
    email: 'billing@northwind.co',
    address: '48 Harbor Rd, Portland, ME 04101',
    taxId: '',
    currency: null,
    terms: null,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  const invoice: Invoice = {
    id: 'sample',
    number: 'INV-0042',
    status: 'draft',
    clientId: client.id,
    issueDate: today,
    dueDate: addDays(today, 14),
    terms: 'net14',
    currency: settings.currency,
    items: [
      {
        id: 's1',
        title: 'Brand identity design',
        description: 'Logo, color system, typography',
        qty: 1,
        rate: 480_000,
      },
      {
        id: 's2',
        title: 'Website design & build',
        description: '8 responsive pages, CMS setup',
        qty: 1,
        rate: 720_000,
      },
      {
        id: 's3',
        title: 'Strategy workshop',
        description: 'Half-day remote session',
        qty: 4,
        rate: 15_000,
      },
    ],
    discountPct: 5,
    taxRateId: 'sample-tax',
    applyTax: true,
    showPaymentDetails: true,
    reference: 'PO-2026-118',
    notes: 'Thank you for your business!',
    paymentDetails:
      settings.business.paymentDetails ||
      'Bank transfer · Chase Bank\nAccount 000123454821 · Routing 021000021',
    templateId: settings.defaultTemplate,
    sentAt: null,
    paidAt: null,
    paidMethod: '',
    paidNote: '',
    clientSnapshot: null,
    businessSnapshot: settings.business.name
      ? null
      : {
          name: 'Tagy Studio',
          email: 'hello@tagy.studio',
          phone: '',
          address: '221 Mercer St, New York, NY 10012',
          taxId: '',
          website: '',
        },
    taxSnapshot: { name: 'Tax', pct: 8 },
    createdAt: now,
    updatedAt: now,
  }
  return { invoice, client }
}
