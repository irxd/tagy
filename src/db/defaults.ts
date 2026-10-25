import type { AppSettings } from './types'

/** Settings for a fresh browser, before the user has changed anything. */
export function defaultSettings(): AppSettings {
  return {
    key: 'app',
    business: {
      name: '',
      logoBlobId: null,
      email: '',
      phone: '',
      address: '',
      taxId: '',
      website: '',
      paymentDetails: '',
    },
    prefix: 'INV-',
    nextNumber: 1,
    currency: 'USD',
    terms: 'net14',
    defaultTaxPct: 0,
    defaultTemplate: 'minimal',
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
