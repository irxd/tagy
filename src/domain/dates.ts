import type { ISODate, PaymentTerms } from '@/db/types'

export const TERM_DAYS: Record<PaymentTerms, number> = {
  receipt: 0,
  net7: 7,
  net14: 14,
  net30: 30,
}

export const TERM_LABELS: Record<PaymentTerms, string> = {
  receipt: 'On receipt',
  net7: 'Net 7',
  net14: 'Net 14',
  net30: 'Net 30',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parts(date: ISODate): [number, number, number] {
  return date.split('-').map(Number) as [number, number, number]
}

function toUTC(date: ISODate): number {
  const [y, m, d] = parts(date)
  return Date.UTC(y, m - 1, d)
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
  return new Date(toUTC(date) + days * 86_400_000).toISOString().slice(0, 10)
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000)
}

export function dueDateFor(issueDate: ISODate, terms: PaymentTerms): ISODate {
  return addDays(issueDate, TERM_DAYS[terms])
}

/**
 * Formats a calendar date with a small pattern language:
 * `dd` 07 · `d` 7 · `MMM` Oct · `MM` 10 · `yyyy` 2026.
 * The default matches the designs: `30 Oct, 2026`.
 */
export function formatDate(date: ISODate, pattern = 'dd MMM, yyyy'): string {
  const [y, m, d] = parts(date)
  const tokens: Record<string, string> = {
    yyyy: String(y),
    MMM: MONTHS[m - 1]!,
    MM: String(m).padStart(2, '0'),
    dd: String(d).padStart(2, '0'),
    d: String(d),
  }
  return pattern.replace(/yyyy|MMM|MM|dd|d/g, (t) => tokens[t]!)
}

/**
 * Short "how long ago" for a past timestamp, in calendar days:
 * Today · Yesterday · 3 days ago · then the date itself after 30 days.
 */
export function timeAgo(timestamp: string, now = new Date()): string {
  const days = daysBetween(todayISO(new Date(timestamp)), todayISO(now))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(todayISO(new Date(timestamp)))
}

/** The backup reminder shows after this many days without a backup. */
export const BACKUP_REMINDER_DAYS = 14

/**
 * Whether to remind about backups: never backed up, or the last backup is
 * over 14 days old, counted from the oldest record when there was none.
 */
export function backupDue(
  lastBackupAt: string | null,
  oldestRecordAt: string | null,
  now = new Date(),
): boolean {
  const since = lastBackupAt ?? oldestRecordAt
  if (!since) return false
  return daysBetween(todayISO(new Date(since)), todayISO(now)) > BACKUP_REMINDER_DAYS
}
