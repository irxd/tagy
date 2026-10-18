export const PAGE_SIZES = [10, 25, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export interface PageInfo {
  /** Current page, 1-based, clamped to the pages that exist. */
  page: number
  pageCount: number
  /** Index range of the rows on this page, for `slice(start, end)`. */
  start: number
  end: number
}

export function pageInfo(total: number, page: number, size: number): PageInfo {
  const pageCount = Math.max(1, Math.ceil(total / size))
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * size
  return { page: current, pageCount, start, end: Math.min(start + size, total) }
}

/**
 * Page buttons to show: always the first and last page, the current page
 * and its neighbours, with gaps ('…') where pages are skipped. A gap of one
 * page shows that page instead, so the list never jumps in length.
 */
export function pageButtons(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const from = Math.min(Math.max(page - 1, 3), pageCount - 4)
  const to = from + 2
  return [
    1,
    from === 3 ? 2 : '…',
    from,
    from + 1,
    to,
    to === pageCount - 2 ? pageCount - 1 : '…',
    pageCount,
  ]
}
