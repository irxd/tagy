import { describe, expect, it } from 'vitest'
import { computeTotals } from './totals'

describe('computeTotals', () => {
  it('matches the worked example in the design (INV-0042)', () => {
    const totals = computeTotals({
      items: [
        { qty: 1, rate: 480_000 }, // Brand identity design
        { qty: 1, rate: 720_000 }, // Website design & build
        { qty: 4, rate: 15_000 }, // Content strategy workshop
      ],
      discountPct: 5,
      taxPct: 8,
    })

    expect(totals).toEqual({
      lines: [480_000, 720_000, 60_000],
      subtotal: 1_260_000, // 12,600.00
      discount: 63_000, // 630.00
      taxable: 1_197_000, // 11,970.00
      tax: 95_760, // 957.60
      total: 1_292_760, // 12,927.60
    })
  })

  it('matches the overdue example in the design (INV-0041)', () => {
    const totals = computeTotals({
      items: [{ qty: 1, rate: 290_741 }],
      discountPct: 0,
      taxPct: 8,
    })
    expect(totals.tax).toBe(23_259) // 23,259.28 → 23,259
    expect(totals.total).toBe(314_000) // 3,140.00
  })

  it('sums rounded lines, not raw products', () => {
    // Each line is 1.5 → 2, so the subtotal is 4, not round(3.0) = 3.
    const totals = computeTotals({
      items: [
        { qty: 0.5, rate: 3 },
        { qty: 0.5, rate: 3 },
      ],
      discountPct: 0,
      taxPct: null,
    })
    expect(totals.subtotal).toBe(4)
  })

  it('skips tax when no rate applies', () => {
    const totals = computeTotals({
      items: [{ qty: 2, rate: 1_000 }],
      discountPct: 10,
      taxPct: null,
    })
    expect(totals).toMatchObject({ subtotal: 2_000, discount: 200, tax: 0, total: 1_800 })
  })

  it('handles an empty invoice', () => {
    expect(computeTotals({ items: [], discountPct: 5, taxPct: 8 })).toEqual({
      lines: [],
      subtotal: 0,
      discount: 0,
      taxable: 0,
      tax: 0,
      total: 0,
    })
  })
})
