import type { ISODate, PaymentTerms } from '@/db/types'

const TERM_DAYS: Record<PaymentTerms, number> = {
  receipt: 0,
  net7: 7,
  net14: 14,
  net30: 30,
}

/** Today in the user's time zone, as `YYYY-MM-DD`. */
export function todayISO(now = new Date()): ISODate {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Adds whole days to a calendar date without time-zone drift. */
export function addDays(date: ISODate, days: number): ISODate {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const utc = new Date(Date.UTC(y, m - 1, d + days))
  return utc.toISOString().slice(0, 10)
}

export function dueDateFor(issueDate: ISODate, terms: PaymentTerms): ISODate {
  return addDays(issueDate, TERM_DAYS[terms])
}
