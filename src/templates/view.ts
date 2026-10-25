import type { Accent, AppSettings, Client, Invoice, Paper, TemplateFonts } from '@/db/types'
import { daysBetween, formatDate } from '@/domain/dates'
import { formatAmount, formatMoney } from '@/domain/money'
import { displayStatus, type DisplayStatus } from '@/domain/status'
import { computeTotals, invoiceTaxPct } from '@/domain/totals'

/** --invoice-accent values from tagy.pen. */
export const ACCENTS: Record<Accent, string> = {
  blue: '#3D5AFE',
  ink: '#141414',
  green: '#1F8A4C',
  orange: '#C2410C',
  pink: '#BE185D',
  violet: '#7C3AED',
}

/**
 * Page width templates lay out at. The design boards draw A4 at 416 px,
 * which prints body text at ~14 pt; at 560 px the same 10 px text prints at
 * ~10.5 pt, a normal invoice size. Measurements inside templates keep the
 * design's values; the extra width goes to flexible areas.
 */
export const PAGE_WIDTH = 560
/** Page height at PAGE_WIDTH, per paper size. */
export const PAGE_HEIGHT: Record<Paper, number> = {
  a4: Math.round((PAGE_WIDTH * 297) / 210),
  letter: Math.round((PAGE_WIDTH * 11) / 8.5),
}

export interface ViewLine {
  id: string
  title: string
  description: string
  qty: string
  rate: string
  amount: string
}

/**
 * Everything a template shows, already formatted. Templates (HTML now, PDF
 * later) read only this, so the preview, print and PDF can't disagree.
 */
export interface InvoiceView {
  number: string
  status: DisplayStatus
  accent: string
  fonts: TemplateFonts
  paper: Paper
  business: {
    name: string
    email: string
    phone: string
    address: string
    taxId: string
    website: string
    logoUrl: string | null
  }
  client: { name: string; contact: string; email: string; address: string; taxId: string } | null
  issued: string
  due: string
  /** `in 14 days`, `Due today`, `12 days late` or `Paid 28 Oct`. */
  dueNote: string
  reference: string
  lines: ViewLine[]
  subtotal: string
  discount: { label: string; value: string } | null
  tax: { label: string; value: string } | null
  /** With currency symbol: `$12,927.60`. */
  total: string
  /** Without symbol, for `12,927.60 USD`. */
  totalAmount: string
  currency: string
  notes: string
  paymentDetails: string | null
  show: { logo: boolean; taxId: boolean; signature: boolean }
}

export interface ViewInput {
  invoice: Invoice
  settings: AppSettings
  client: Client | undefined
  logoUrl: string | null
  today: string
}

export function buildInvoiceView({
  invoice,
  settings,
  client,
  logoUrl,
  today,
}: ViewInput): InvoiceView {
  const { currency } = invoice
  const locale = settings.locale
  const amount = (minor: number) => formatAmount(minor, currency, locale)
  const taxPct = invoiceTaxPct(invoice)
  const totals = computeTotals({ items: invoice.items, discountPct: invoice.discountPct, taxPct })
  const status = displayStatus(invoice, today)
  const qtyFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 4 })

  // Sent invoices show what was frozen at send time; drafts show live data.
  const business = { ...settings.business, ...invoice.businessSnapshot }
  const party = invoice.clientSnapshot ?? client

  const dueIn = daysBetween(today, invoice.dueDate)
  const dueNote =
    status === 'paid'
      ? `Paid ${invoice.paidAt ? formatDate(invoice.paidAt, 'd MMM') : ''}`.trim()
      : dueIn > 0
        ? `in ${dueIn} day${dueIn === 1 ? '' : 's'}`
        : dueIn === 0
          ? 'Due today'
          : `${-dueIn} day${dueIn === -1 ? '' : 's'} late`

  return {
    number: invoice.number,
    status,
    accent: ACCENTS[settings.accent],
    fonts: settings.fonts,
    paper: settings.paper,
    business: {
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      taxId: business.taxId,
      website: business.website,
      logoUrl,
    },
    client: party
      ? {
          name: party.name,
          contact: party.contact,
          email: party.email,
          address: party.address,
          taxId: party.taxId,
        }
      : null,
    issued: formatDate(invoice.issueDate, settings.dateFormat),
    due: formatDate(invoice.dueDate, settings.dateFormat),
    dueNote,
    reference: invoice.reference,
    lines: invoice.items.map((item, i) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      qty: qtyFormat.format(item.qty),
      rate: amount(item.rate),
      amount: amount(totals.lines[i] ?? 0),
    })),
    subtotal: amount(totals.subtotal),
    discount: totals.discount
      ? { label: `Discount (${invoice.discountPct}%)`, value: `−${amount(totals.discount)}` }
      : null,
    tax: taxPct ? { label: `Tax (${taxPct}%)`, value: amount(totals.tax) } : null,
    total: formatMoney(totals.total, currency, locale),
    totalAmount: amount(totals.total),
    currency,
    notes: invoice.notes.trim(),
    paymentDetails:
      invoice.showPaymentDetails &&
      settings.showFields.paymentDetails &&
      invoice.paymentDetails.trim()
        ? invoice.paymentDetails.trim()
        : null,
    show: {
      logo: settings.showFields.logo && !!logoUrl,
      taxId: settings.showFields.taxId,
      signature: settings.showFields.signature,
    },
  }
}
