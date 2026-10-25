/*
 * Data upgrades between schema versions. Each step is a plain function on
 * the raw records so the Dexie upgrade (db.ts) and backup import (backup.ts)
 * run the same code.
 */

type Raw = Record<string, unknown>

interface V1TaxRate {
  id: string
  pct: number
}

/**
 * v1 → v2: tax moves from a list of rates in Settings onto each invoice.
 * An invoice keeps the percent it uses now: its frozen rate if it was sent,
 * otherwise the Settings rate it points to.
 */
export function invoiceV1toV2(invoice: Raw, rates: V1TaxRate[]): Raw {
  const { taxRateId, taxSnapshot, ...rest } = invoice
  const pct =
    (taxSnapshot as { pct?: number } | null)?.pct ?? rates.find((t) => t.id === taxRateId)?.pct ?? 0
  return { ...rest, taxPct: pct, applyTax: rest.applyTax === true && pct > 0 }
}

export function settingsV1toV2(settings: Raw): Raw {
  const { taxRates, defaultTaxRateId, ...rest } = settings
  const rates = (taxRates as V1TaxRate[] | undefined) ?? []
  return { ...rest, defaultTaxPct: rates.find((t) => t.id === defaultTaxRateId)?.pct ?? 0 }
}

export function taxRatesV1(settings: Raw | undefined): V1TaxRate[] {
  return (settings?.taxRates as V1TaxRate[] | undefined) ?? []
}

const FONTS_V2: Record<string, string> = {
  sans: 'template',
  serif: 'newsreader',
  mono: 'geist-mono',
}

/**
 * v2 → v3: the Font setting becomes a named font for headings and one for
 * body text, instead of one Sans, Serif or Mono choice.
 */
export function settingsV2toV3(settings: Raw): Raw {
  const { font, ...rest } = settings
  if (font === undefined) return settings
  const named = FONTS_V2[font as string] ?? (typeof font === 'string' ? font : 'template')
  return { ...rest, fonts: { heading: named, body: named } }
}

/**
 * v3 → v4: the same step again, for databases upgraded by an earlier build
 * of v3 that kept one named `font` instead of heading and body `fonts`.
 */
export const settingsV3toV4 = settingsV2toV3

/**
 * v4 → v5: each invoice gets its own date format, taken from Settings so it
 * looks as it does now, and room for business details edited on it alone.
 */
export function invoiceV4toV5(invoice: Raw, settings: Raw | undefined): Raw {
  return {
    ...invoice,
    dateFormat: invoice.dateFormat ?? settings?.dateFormat ?? 'dd MMM, yyyy',
    businessOverride: invoice.businessOverride ?? null,
  }
}
