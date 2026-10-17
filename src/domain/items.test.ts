import { describe, expect, it } from 'vitest'
import { newLineItem, recentItems } from './items'

const item = (title: string) => newLineItem({ title, rate: 100 })
const inv = (id: string, updatedAt: string, titles: string[]) => ({
  id,
  updatedAt,
  items: titles.map(item),
})

describe('newLineItem', () => {
  it('starts as one unit at zero with a fresh id', () => {
    const a = newLineItem()
    expect(a).toMatchObject({ title: '', description: '', qty: 1, rate: 0 })
    expect(a.id).not.toBe(newLineItem().id)
  })
})

describe('recentItems', () => {
  const invoices = [
    inv('old', '2026-09-01T00:00:00Z', ['Logo design', 'Retainer']),
    inv('new', '2026-10-10T00:00:00Z', ['Design hour', 'logo design', '']),
    inv('current', '2026-10-17T00:00:00Z', ['Art direction']),
  ]

  it('lists distinct titles from other invoices, newest first', () => {
    expect(recentItems(invoices, 'current').map((i) => i.title)).toEqual([
      'Design hour',
      'logo design',
      'Retainer',
    ])
  })

  it('stops at the limit', () => {
    expect(recentItems(invoices, 'x', 2).map((i) => i.title)).toEqual([
      'Art direction',
      'Design hour',
    ])
  })
})
