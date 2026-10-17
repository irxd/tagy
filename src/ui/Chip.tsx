import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

/** Tile/Chip — small soft pill with an optional icon. */
export function Chip({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-tile-tile py-1.5 pr-3 pl-2.5 text-[13px] font-semibold text-tile-muted',
        className,
      )}
    >
      {Icon && <Icon size={14} aria-hidden />}
      {children}
    </span>
  )
}

/** Tile/Mini Chip — tiny tag, e.g. the `8%` on a Stat. */
export function MiniChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full bg-tile-panel px-[7px] py-[3px] text-[11px] font-medium text-tile-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Tile/Filter — pill with a count bubble; dark when active. On the canvas
 * background (mobile) inactive pills sit on `panel` white instead of `tile`.
 */
export function FilterPill({
  active,
  count,
  surface = 'tile',
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean
  count?: number
  surface?: 'tile' | 'panel'
}) {
  const onPanel = surface === 'panel'
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-[7px] rounded-full py-2 pr-3 pl-3.5 text-sm font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent',
        active
          ? 'bg-tile-fg text-white'
          : onPanel
            ? 'bg-tile-panel text-tile-fg hover:bg-tile-tile'
            : 'bg-tile-tile text-tile-fg hover:bg-tile-tile-strong',
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-[7px] py-px text-xs font-semibold',
            active
              ? 'bg-white/15 text-white'
              : onPanel
                ? 'bg-tile-tile text-tile-muted'
                : 'bg-tile-panel text-tile-muted',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/** Tile/Dropdown — soft pill button with a chevron, used as a menu trigger. */
export const DropdownButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function DropdownButton({ children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-tile-tile py-[9px] pr-3.5 pl-4 text-sm font-semibold text-tile-fg transition-colors hover:bg-tile-tile-strong',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown size={16} aria-hidden />
    </button>
  )
})
