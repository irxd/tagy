import type { LucideIcon } from 'lucide-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { Link } from 'react-router'
import { cn } from './cn'
import type { SelectOption } from './Field'

/*
 * Mobile grouped list (Mobile · Settings): a muted group title over a white
 * rounded list of rows. Each row has an icon tile, title, optional subtitle,
 * an optional value on the right and a chevron.
 */

export function ListGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <h2 className="text-[13px] font-semibold text-tile-muted">{title}</h2>
      <ul className="flex flex-col rounded-[18px] border border-tile-border bg-tile-panel px-3.5 py-0.5">
        {children}
      </ul>
    </section>
  )
}

type Tone = 'default' | 'accent' | 'danger'

const iconTones: Record<Tone, string> = {
  default: 'bg-tile-tile text-tile-fg',
  accent: 'bg-tile-accent-soft text-tile-accent',
  danger: 'bg-tile-danger-soft text-tile-danger',
}

interface RowContentProps {
  icon: LucideIcon
  title: string
  subtitle?: ReactNode
  value?: ReactNode
  tone?: Tone
  /** Replaces the chevron, e.g. an Export button. */
  trailing?: ReactNode
}

function RowContent({
  icon: Icon,
  title,
  subtitle,
  value,
  tone = 'default',
  trailing,
}: RowContentProps) {
  return (
    <>
      <span
        className={cn('grid size-8 shrink-0 place-items-center rounded-[10px]', iconTones[tone])}
      >
        <Icon size={16} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px text-left">
        <span
          className={cn(
            'text-[15px] font-semibold',
            tone === 'danger' ? 'text-tile-danger' : 'text-tile-fg',
          )}
        >
          {title}
        </span>
        {subtitle && <span className="truncate text-xs text-tile-muted">{subtitle}</span>}
      </span>
      {value && <span className="shrink-0 text-sm text-tile-muted">{value}</span>}
      {trailing ?? <ChevronRight size={16} className="shrink-0 text-tile-subtle" aria-hidden />}
    </>
  )
}

const rowClass =
  'flex min-h-14 w-full items-center gap-3 py-3 outline-none focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-tile-accent'

function Item({ children }: { children: ReactNode }) {
  return <li className="border-b border-tile-border last:border-b-0">{children}</li>
}

export function ListLink({ to, ...content }: RowContentProps & { to: string }) {
  return (
    <Item>
      <Link to={to} className={rowClass}>
        <RowContent {...content} />
      </Link>
    </Item>
  )
}

export function ListButton({
  onClick,
  disabled,
  ...content
}: RowContentProps & { onClick: () => void; disabled?: boolean }) {
  return (
    <Item>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(rowClass, 'disabled:opacity-50')}
      >
        <RowContent {...content} />
      </button>
    </Item>
  )
}

/** Static row with its own trailing control (e.g. an Export button). */
export function ListRow(content: RowContentProps) {
  return (
    <Item>
      <div className={rowClass}>
        <RowContent {...content} />
      </div>
    </Item>
  )
}

/** A row that opens the native picker; shows the selected option's label as its value. */
export function ListSelect({
  options,
  value,
  ...rest
}: Omit<RowContentProps, 'value'> &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'title'> & {
    options: SelectOption[]
    value: string
  }) {
  const { icon, title, subtitle, tone, trailing, ...select } = rest
  const label = options.find((o) => o.value === value)?.label ?? value
  return (
    <Item>
      <label
        className={cn(
          rowClass,
          'relative cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-tile-accent',
        )}
      >
        <RowContent
          icon={icon}
          title={title}
          subtitle={subtitle}
          tone={tone}
          trailing={trailing}
          value={label}
        />
        <select
          aria-label={title}
          value={value}
          className="absolute inset-0 cursor-pointer opacity-0"
          {...select}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </Item>
  )
}

/** Mobile sub-page header: round back button and a centred title. */
export function SubPageHeader({ title, backTo }: { title: string; backTo: string }) {
  return (
    <header className="grid grid-cols-[40px_1fr_40px] items-center">
      <Link
        to={backTo}
        aria-label="Back"
        className="grid size-10 place-items-center rounded-full bg-tile-panel text-tile-fg focus-visible:outline-2 focus-visible:outline-tile-accent"
      >
        <ChevronLeft size={18} aria-hidden />
      </Link>
      <h1 className="text-center text-[17px] font-bold tracking-[-0.3px]">{title}</h1>
    </header>
  )
}
