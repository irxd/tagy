import { describe, expect, it } from 'vitest'
import {
  currencyDigits,
  formatAmount,
  formatMoney,
  formatMoneyCompact,
  lineAmount,
  minorToDecimal,
  parseMoney,
  percentOf,
} from './money'

describe('currencyDigits', () => {
  it('reads minor-unit digits from Intl', () => {
    expect(currencyDigits('USD')).toBe(2)
    expect(currencyDigits('JPY')).toBe(0)
    expect(currencyDigits('BHD')).toBe(3)
  })
})

describe('lineAmount', () => {
  it('multiplies whole quantities exactly', () => {
    expect(lineAmount(4, 15_000)).toBe(60_000)
  })

  it('rounds fractional results half-up', () => {
    expect(lineAmount(0.5, 3)).toBe(2) // 1.5 → 2
    expect(lineAmount(0.25, 3)).toBe(1) // 0.75 → 1
    expect(lineAmount(0.1, 4)).toBe(0) // 0.4 → 0
  })

  it('avoids binary float drift', () => {
    // 1.15 × 333 = 382.95 exactly; naive floats give 382.9499… and round down.
    expect(lineAmount(1.15, 333)).toBe(383)
    expect(lineAmount(1.005, 100)).toBe(101) // 100.5 → 101
  })

  it('rounds negative amounts away from zero', () => {
    expect(lineAmount(-0.5, 3)).toBe(-2)
  })
})

describe('percentOf', () => {
  it('takes a percentage and rounds half-up', () => {
    expect(percentOf(1_260_000, 5)).toBe(63_000)
    expect(percentOf(1_197_000, 8)).toBe(95_760)
    expect(percentOf(1, 50)).toBe(1) // 0.5 → 1
    expect(percentOf(3, 50)).toBe(2) // 1.5 → 2
    expect(percentOf(-1, 50)).toBe(-1)
  })

  it('supports fractional percentages', () => {
    expect(percentOf(10_000, 7.25)).toBe(725)
    expect(percentOf(999, 12.5)).toBe(125) // 124.875 → 125
  })
})

describe('parseMoney', () => {
  it('parses typed amounts into minor units', () => {
    expect(parseMoney('4,800', 'USD')).toBe(480_000)
    expect(parseMoney('4800.5', 'USD')).toBe(480_050)
    expect(parseMoney('$1,234.56', 'USD')).toBe(123_456)
    expect(parseMoney('.5', 'USD')).toBe(50)
    expect(parseMoney('7.', 'USD')).toBe(700)
    expect(parseMoney('-10', 'USD')).toBe(-1_000)
    expect(parseMoney('¥1,500', 'JPY')).toBe(1_500)
  })

  it('rejects non-numbers and too many decimals', () => {
    expect(parseMoney('', 'USD')).toBeNull()
    expect(parseMoney('.', 'USD')).toBeNull()
    expect(parseMoney('abc', 'USD')).toBeNull()
    expect(parseMoney('1.2.3', 'USD')).toBeNull()
    expect(parseMoney('12.345', 'USD')).toBeNull()
    expect(parseMoney('1.5', 'JPY')).toBeNull()
  })
})

describe('minorToDecimal', () => {
  it('renders minor units as an editable decimal', () => {
    expect(minorToDecimal(480_000, 'USD')).toBe('4800.00')
    expect(minorToDecimal(5, 'USD')).toBe('0.05')
    expect(minorToDecimal(-1_050, 'USD')).toBe('-10.50')
    expect(minorToDecimal(1_500, 'JPY')).toBe('1500')
  })

  it('round-trips with parseMoney', () => {
    for (const minor of [0, 1, 99, 100, 123_456, -42]) {
      expect(parseMoney(minorToDecimal(minor, 'USD'), 'USD')).toBe(minor)
    }
  })
})

describe('formatting', () => {
  it('formats with currency symbol and grouping', () => {
    expect(formatMoney(1_292_760, 'USD')).toBe('$12,927.60')
    expect(formatMoney(1_500, 'JPY')).toBe('¥1,500')
  })

  it('formats table amounts without a symbol', () => {
    expect(formatAmount(1_292_760, 'USD')).toBe('12,927.60')
    expect(formatAmount(-63_000, 'USD')).toBe('-630.00')
  })

  it('formats compact chart labels', () => {
    expect(formatMoneyCompact(4_180_000, 'USD')).toBe('$41.8K')
  })
})
