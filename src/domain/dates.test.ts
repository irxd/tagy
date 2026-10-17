import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, dueDateFor, formatDate, timeAgo, todayISO } from './dates'

describe('dates', () => {
  it('formats today as a local calendar date', () => {
    expect(todayISO(new Date(2026, 9, 7, 23, 59))).toBe('2026-10-07')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-16', 14)).toBe('2026-10-30')
    expect(addDays('2026-12-25', 7)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('counts whole days between dates', () => {
    expect(daysBetween('2026-10-30', '2026-11-11')).toBe(12)
    expect(daysBetween('2026-10-30', '2026-10-16')).toBe(-14)
    expect(daysBetween('2026-10-30', '2026-10-30')).toBe(0)
  })

  it('derives the due date from payment terms', () => {
    expect(dueDateFor('2026-10-16', 'receipt')).toBe('2026-10-16')
    expect(dueDateFor('2026-10-16', 'net7')).toBe('2026-10-23')
    expect(dueDateFor('2026-10-16', 'net14')).toBe('2026-10-30')
    expect(dueDateFor('2026-10-16', 'net30')).toBe('2026-11-15')
  })

  it('formats dates the way the designs show them', () => {
    expect(formatDate('2026-10-30')).toBe('30 Oct, 2026')
    expect(formatDate('2026-10-16', 'MMM d, yyyy')).toBe('Oct 16, 2026')
    expect(formatDate('2026-10-02', 'd MMM')).toBe('2 Oct')
    expect(formatDate('2026-10-02', 'dd/MM/yyyy')).toBe('02/10/2026')
  })

  it('describes how long ago a timestamp was', () => {
    const now = new Date(2026, 9, 17, 9, 0)
    expect(timeAgo(new Date(2026, 9, 17, 8, 0).toISOString(), now)).toBe('Today')
    expect(timeAgo(new Date(2026, 9, 16, 23, 0).toISOString(), now)).toBe('Yesterday')
    expect(timeAgo(new Date(2026, 9, 14, 12, 0).toISOString(), now)).toBe('3 days ago')
    expect(timeAgo(new Date(2026, 8, 1, 12, 0).toISOString(), now)).toBe('01 Sep, 2026')
  })
})
