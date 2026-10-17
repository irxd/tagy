/**
 * Stored records. Field lists follow the data model in docs/build-plan.md.
 * Money is always integer minor units (cents for USD); dates are ISO strings.
 */

/** Calendar date, `YYYY-MM-DD`. */
export type ISODate = string
/** Timestamp, `new Date().toISOString()`. */
export type ISODateTime = string

/** Stored status. Overdue is derived (sent + past due), never stored. */
export type InvoiceStatus = 'draft' | 'sent' | 'paid'

export type PaymentTerms = 'receipt' | 'net7' | 'net14' | 'net30'

export type TemplateId = 'minimal' | 'classic' | 'bold' | 'studio'
export type Accent = 'blue' | 'ink' | 'green' | 'orange' | 'pink' | 'violet'
export type TemplateFont = 'sans' | 'serif' | 'mono'
export type Paper = 'a4' | 'letter'

export interface LineItem {
  id: string
  title: string
  description: string
  /** May be fractional, e.g. 1.5 hours. */
  qty: number
  /** Minor units per unit. */
  rate: number
}

export interface TaxRate {
  id: string
  name: string
  /** Percent, e.g. 8 for 8%. */
  pct: number
}

export interface Business {
  name: string
  /** Key into the `blobs` store, or null when no logo is set. */
  logoBlobId: string | null
  email: string
  phone: string
  address: string
  taxId: string
  website: string
  paymentDetails: string
}

export interface ClientSnapshot {
  name: string
  contact: string
  email: string
  address: string
  taxId: string
}

export interface Invoice {
  id: string
  number: string
  status: InvoiceStatus
  clientId: string | null
  issueDate: ISODate
  dueDate: ISODate
  terms: PaymentTerms
  /** ISO 4217 code, e.g. `USD`. */
  currency: string
  items: LineItem[]
  discountPct: number
  taxRateId: string | null
  applyTax: boolean
  showPaymentDetails: boolean
  reference: string
  notes: string
  paymentDetails: string
  templateId: TemplateId
  sentAt: ISODateTime | null
  paidAt: ISODate | null
  paidMethod: string
  paidNote: string
  /** Frozen when the invoice is marked Sent, so later edits elsewhere don't rewrite it. */
  clientSnapshot: ClientSnapshot | null
  businessSnapshot: Omit<Business, 'logoBlobId' | 'paymentDetails'> | null
  taxSnapshot: Omit<TaxRate, 'id'> | null
  /** Seeded by "Explore with sample data"; removed by its one-click clear. */
  sample?: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Client {
  id: string
  name: string
  contact: string
  email: string
  address: string
  taxId: string
  /** Overrides the Settings default when set. */
  currency: string | null
  terms: PaymentTerms | null
  archived: boolean
  sample?: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ShowFields {
  logo: boolean
  taxId: boolean
  paymentDetails: boolean
  signature: boolean
}

/** Business profile + app settings, stored as one record under key `app`. */
export interface AppSettings {
  key: 'app'
  business: Business
  prefix: string
  nextNumber: number
  currency: string
  terms: PaymentTerms
  taxRates: TaxRate[]
  defaultTaxRateId: string | null
  defaultTemplate: TemplateId
  accent: Accent
  font: TemplateFont
  paper: Paper
  showFields: ShowFields
  defaultNotes: string
  /** "Add to new invoices by default" for payment details. */
  paymentDetailsByDefault: boolean
  /** BCP 47 tag used for number and date formatting, e.g. `en-US`. */
  locale: string
  dateFormat: string
  lastBackupAt: ISODateTime | null
}

export interface StoredBlob {
  id: string
  type: string
  data: Blob
}
