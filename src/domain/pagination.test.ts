import { describe, expect, it } from 'vitest'
import { pageButtons, pageInfo } from './pagination'

describe('pageInfo', () => {
  it('gives the row range for a page', () => {
    expect(pageInfo(37, 1, 10)).toEqual({ page: 1, pageCount: 4, start: 0, end: 10 })
    expect(pageInfo(37, 4, 10)).toEqual({ page: 4, pageCount: 4, start: 30, end: 37 })
  })

  it('clamps a page that no longer exists, e.g. after a delete or filter', () => {
    expect(pageInfo(12, 5, 10)).toMatchObject({ page: 2, start: 10, end: 12 })
    expect(pageInfo(12, 0, 10)).toMatchObject({ page: 1 })
  })

  it('has one empty page when there are no rows', () => {
    expect(pageInfo(0, 1, 10)).toEqual({ page: 1, pageCount: 1, start: 0, end: 0 })
  })
})

describe('pageButtons', () => {
  it('lists every page when there are few', () => {
    expect(pageButtons(1, 1)).toEqual([1])
    expect(pageButtons(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('keeps first, last and the neighbours of the current page', () => {
    expect(pageButtons(1, 10)).toEqual([1, 2, 3, 4, 5, '…', 10])
    expect(pageButtons(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10])
    expect(pageButtons(10, 10)).toEqual([1, '…', 6, 7, 8, 9, 10])
  })
})
