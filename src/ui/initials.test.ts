import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('takes the first letters of the first two words', () => {
    expect(initials('Northwind Studio')).toBe('NS')
    expect(initials('Harbor & Field')).toBe('HF')
    expect(initials('  Acme   Co.  ')).toBe('AC')
  })

  it('handles one word, accents and empty names', () => {
    expect(initials('mono')).toBe('MO')
    expect(initials('Ébène Café')).toBe('ÉC')
    expect(initials('')).toBe('?')
    expect(initials('& —')).toBe('?')
  })
})
