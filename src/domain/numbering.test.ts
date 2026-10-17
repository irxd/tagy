import { describe, expect, it } from 'vitest'
import { formatInvoiceNumber } from './numbering'

describe('formatInvoiceNumber', () => {
  it('zero-pads to four digits', () => {
    expect(formatInvoiceNumber('INV-', 43)).toBe('INV-0043')
    expect(formatInvoiceNumber('', 1)).toBe('0001')
  })

  it('keeps every digit past four', () => {
    expect(formatInvoiceNumber('INV-', 12_345)).toBe('INV-12345')
  })
})
