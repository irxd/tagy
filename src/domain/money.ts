/**
 * Money is stored as integer minor units (cents for USD, yen for JPY).
 * Arithmetic that can produce fractions (qty × rate, percentages) runs on
 * BigInt scaled integers so rounding is exact, then rounds half-up (away
 * from zero on .5) back to whole minor units.
 */

/** Quantities and percentages keep up to this many decimals. */
const QTY_SCALE = 10_000n
const PCT_SCALE = 100n

/** Decimal digits of a currency's minor unit: USD 2, JPY 0, BHD 3. */
export function currencyDigits(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
    .maximumFractionDigits!
}

/** Rounds `num / den` half-up (away from zero) to an integer. `den` must be positive. */
function divRoundHalfUp(num: bigint, den: bigint): bigint {
  const sign = num < 0n ? -1n : 1n
  const abs = num * sign
  return sign * ((abs * 2n + den) / (den * 2n))
}

function scale(value: number, factor: bigint): bigint {
  return BigInt(Math.round(value * Number(factor)))
}

/** `qty × rate`, rounded half-up to whole minor units. */
export function lineAmount(qty: number, rate: number): number {
  return Number(divRoundHalfUp(scale(qty, QTY_SCALE) * BigInt(rate), QTY_SCALE))
}

/** `amount × pct%`, rounded half-up to whole minor units. */
export function percentOf(amount: number, pct: number): number {
  return Number(divRoundHalfUp(BigInt(amount) * scale(pct, PCT_SCALE), 100n * PCT_SCALE))
}

/**
 * Parses what a person typed into minor units: `4,800`, `4800.5`, `$1,234.56`.
 * Accepts `.` as the decimal mark and ignores grouping commas, spaces and
 * currency symbols. Returns null when the text isn't a number or has more
 * decimals than the currency allows.
 */
export function parseMoney(text: string, currency: string): number | null {
  const digits = currencyDigits(currency)
  const cleaned = text.replace(/[^\d.-]/g, '')
  const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(cleaned)
  if (!match || (match[2] === '' && !match[3])) return null
  const [, minus, whole = '', frac = ''] = match
  if (frac.length > digits) return null
  const minor =
    BigInt(whole || '0') * 10n ** BigInt(digits) + BigInt(frac.padEnd(digits, '0') || '0')
  return Number(minus ? -minor : minor)
}

/** Minor units as a plain decimal string for inputs: 480000 USD → `4800.00`. */
export function minorToDecimal(minor: number, currency: string): string {
  const digits = currencyDigits(currency)
  const sign = minor < 0 ? '-' : ''
  const abs = String(Math.abs(minor)).padStart(digits + 1, '0')
  return digits === 0 ? `${sign}${abs}` : `${sign}${abs.slice(0, -digits)}.${abs.slice(-digits)}`
}

/** `$12,927.60` — currency symbol, grouping and decimals from the locale. */
export function formatMoney(minor: number, currency: string, locale = 'en-US'): string {
  const digits = currencyDigits(currency)
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 10 ** digits)
}

/** `12,927.60` — no currency symbol, for invoice tables. */
export function formatAmount(minor: number, currency: string, locale = 'en-US'): string {
  const digits = currencyDigits(currency)
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minor / 10 ** digits)
}

/** `$41.8K` — short form for chart labels. */
export function formatMoneyCompact(minor: number, currency: string, locale = 'en-US'): string {
  const digits = currencyDigits(currency)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(minor / 10 ** digits)
}
