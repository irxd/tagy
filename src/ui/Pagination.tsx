import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZES, pageButtons, type PageInfo, type PageSize } from '@/domain/pagination'
import { cn } from './cn'

const step =
  'grid place-items-center rounded-full text-sm font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-tile-accent disabled:text-tile-muted disabled:opacity-50'

/**
 * Pager under a list: rows-per-page choice and "1–10 of 37" on the left,
 * previous / page numbers / next on the right. `compact` (mobile) drops the
 * page numbers, keeping just previous and next.
 */
export function Pagination({
  info,
  total,
  size,
  onPage,
  onSize,
  compact,
}: {
  info: PageInfo
  total: number
  size: PageSize
  onPage: (page: number) => void
  onSize: (size: PageSize) => void
  compact?: boolean
}) {
  const { page, pageCount, start, end } = info
  // 44 px touch targets on mobile.
  const target = compact ? 'size-11' : 'size-8'
  return (
    <div className="flex items-center justify-between gap-3 px-1 text-sm text-tile-muted">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          {!compact && 'Show'}
          <span className="relative">
            <select
              aria-label="Invoices per page"
              value={size}
              onChange={(e) => onSize(Number(e.target.value) as PageSize)}
              className={cn(
                'appearance-none rounded-full',
                compact ? 'h-11 pr-8 pl-4' : 'h-8 pr-7 pl-3',
                'bg-tile-tile font-semibold text-tile-fg focus-visible:outline-2 focus-visible:outline-tile-accent',
              )}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-tile-fg"
              aria-hidden
            />
          </span>
          {!compact && 'per page'}
        </label>
        <span aria-live="polite" className="tabular-nums">
          {total ? `${start + 1}–${end} of ${total}` : '0 of 0'}
        </span>
      </div>
      <nav aria-label="Pages" className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={cn(step, target, 'text-tile-fg enabled:hover:bg-tile-tile')}
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        {!compact &&
          pageButtons(page, pageCount).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="grid size-8 place-items-center" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
                className={cn(
                  step,
                  target,
                  p === page ? 'bg-tile-fg text-white' : 'text-tile-fg hover:bg-tile-tile',
                )}
              >
                {p}
              </button>
            ),
          )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className={cn(step, target, 'text-tile-fg enabled:hover:bg-tile-tile')}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </nav>
    </div>
  )
}
