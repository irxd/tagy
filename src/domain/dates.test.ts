import { describe, expect, it } from 'vitest'
import { addDays, dueDateFor, todayISO } from './dates'

describe('dates', () => {
  it('formats today as a local calendar date', () => {
    expect(todayISO(new Date(2026, 9, 7, 23, 59))).toBe('2026-10-07')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-16', 14)).toBe('2026-10-30')
    expect(addDays('2026-12-25', 7)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('derives the due date from payment terms', () => {
    expect(dueDateFor('2026-10-16', 'receipt')).toBe('2026-10-16')
    expect(dueDateFor('2026-10-16', 'net14')).toBe('2026-10-30')
    expect(dueDateFor('2026-10-16', 'net30')).toBe('2026-11-15')
  })
})
