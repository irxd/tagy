import type { PaymentTerms, TemplateId } from '@/db/types'
import { formatDate, TERM_LABELS, todayISO } from '@/domain/dates'
import { formatAmount } from '@/domain/money'
import type { SelectOption } from '@/ui/Field'

const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' })

/** Every ISO 4217 currency the browser knows, as `USD — US Dollar`. */
export const currencyOptions: SelectOption[] = Intl.supportedValuesOf('currency').map((code) => ({
  value: code,
  label: `${code} — ${currencyNames.of(code) ?? code}`,
}))

export const termOptions: SelectOption[] = (Object.keys(TERM_LABELS) as PaymentTerms[]).map(
  (value) => ({ value, label: TERM_LABELS[value] }),
)

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  minimal: 'Swiss Ledger',
  classic: 'Serif Ledger',
  bold: 'Bold',
  studio: 'Editorial Mono',
}

export const templateOptions: SelectOption[] = (Object.keys(TEMPLATE_LABELS) as TemplateId[]).map(
  (value) => ({ value, label: TEMPLATE_LABELS[value] }),
)

/** English only in v1 (decision 5). */
export const languageOptions: SelectOption[] = [{ value: 'en', label: 'English' }]

export const DATE_PATTERNS = [
  'dd MMM, yyyy',
  'MMM d, yyyy',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'yyyy-MM-dd',
]

/** Date formats, each labelled with today's date in that format. */
export function dateFormatOptions(today = todayISO()): SelectOption[] {
  return DATE_PATTERNS.map((pattern) => ({ value: pattern, label: formatDate(today, pattern) }))
}

/** Number styles are picked by locale; the label shows what 1234.56 looks like. */
export const numberLocaleOptions: SelectOption[] = [
  'en-US',
  'de-DE',
  'fr-FR',
  'en-IN',
  'de-CH',
].map((locale) => ({ value: locale, label: formatAmount(123_456, 'USD', locale) }))
