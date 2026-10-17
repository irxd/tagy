import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

/** Bordered card with an icon tile, title and one-line description (Settings bento). */
export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  hideHeader,
}: {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
  className?: string
  hideHeader?: boolean
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex flex-col gap-3.5 rounded-tile-lg border border-tile-border bg-tile-panel p-5',
        className,
      )}
    >
      <header className={cn('flex items-center gap-3 pb-1', hideHeader && 'sr-only')}>
        <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-tile-tile text-tile-fg">
          <Icon size={17} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-px">
          <h2 className="text-[17px] font-bold text-tile-fg">{title}</h2>
          {description && <p className="text-[13px] text-tile-muted">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

/** Two fields side by side on wide screens, stacked on narrow ones. */
export function FieldRow({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={cn('grid gap-2', cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {children}
    </div>
  )
}
