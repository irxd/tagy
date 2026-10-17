import type { ReactNode } from 'react'
import { cn } from './cn'
import { initials } from './initials'

const avatarTones = {
  ink: 'bg-tile-fg text-white',
  danger: 'bg-tile-danger text-white',
  quiet: 'bg-tile-tile-strong text-tile-fg',
  light: 'bg-tile-panel text-tile-fg',
}

/** Round initials badge (Tile/Party → Logo). Red flags overdue, grey means settled. */
export function Avatar({
  name,
  tone = 'ink',
  className,
}: {
  name: string
  tone?: keyof typeof avatarTones
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold',
        avatarTones[tone],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

/** Tile/Party — avatar, bold name and a muted line under it. */
export function Party({
  name,
  sub,
  className,
}: {
  name: string
  sub?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3 py-1', className)}>
      <Avatar name={name} />
      <div className="flex min-w-0 flex-col gap-px">
        <span className="truncate text-base font-bold tracking-[-0.2px] text-tile-fg">{name}</span>
        {sub && <span className="truncate text-[13px] text-tile-muted">{sub}</span>}
      </div>
    </div>
  )
}

/** Tile/Figure — big number over a label (Total due, Billed, Paid). */
export function Figure({
  value,
  label,
  tone = 'fg',
  className,
}: {
  value: ReactNode
  label: ReactNode
  tone?: 'fg' | 'success' | 'orange' | 'danger'
  className?: string
}) {
  const color = {
    fg: 'text-tile-fg',
    success: 'text-tile-success-ink',
    orange: 'text-tile-orange',
    danger: 'text-tile-danger-ink',
  }[tone]
  return (
    <div className={cn('flex flex-col gap-[3px]', className)}>
      <span className={cn('text-2xl font-bold tracking-[-0.6px] tabular-nums', color)}>
        {value}
      </span>
      <span className="text-sm text-tile-muted">{label}</span>
    </div>
  )
}

/** Tile/Stat — small soft tile: label + optional chip, bold value. */
export function Stat({
  label,
  value,
  chip,
  className,
}: {
  label: ReactNode
  value: ReactNode
  chip?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-tile-md bg-tile-tile pt-2.5 pr-2.5 pb-3 pl-3',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[13px] text-tile-muted">{label}</span>
        {chip}
      </div>
      <span className="truncate text-[15px] font-bold text-tile-fg tabular-nums">{value}</span>
    </div>
  )
}
