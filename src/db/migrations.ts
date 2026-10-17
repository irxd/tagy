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
