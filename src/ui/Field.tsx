import type { LucideIcon } from 'lucide-react'
import { Calendar, ChevronDown } from 'lucide-react'
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from './cn'

/*
 * Tile/Field — a soft tile with a small label over a bold value. The label
 * turns accent and the tile gets an accent border while focused
 * (Tile/Field/Focused). Inputs are native so mobile keyboards, date pickers
 * and screen readers work without extra code. The whole tile is the hit
 * area: a press on its padding or icon focuses the control.
 */

const shell = cn(
  'group relative flex w-full items-center gap-2 rounded-tile-md border-[1.5px] border-transparent bg-tile-tile px-3.5 pt-2.5 pb-[11px] transition-colors',
  'focus-within:border-tile-accent focus-within:bg-tile-panel',
  'has-[[aria-invalid=true]]:border-tile-danger',
)
const labelClass = 'text-[13px] text-tile-muted group-focus-within:text-tile-accent'
const valueClass =
  'w-full min-w-0 bg-transparent text-[15px] font-bold text-tile-fg outline-none placeholder:font-normal placeholder:text-tile-subtle'

interface FieldFrameProps {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  trailing?: ReactNode
  className?: string
  children: ReactNode
}

function focusControl(id: string) {
  return (e: MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, label'))
      return
    e.preventDefault()
    document.getElementById(id)?.focus()
  }
}

function FieldFrame({ id, label, error, hint, trailing, className, children }: FieldFrameProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className={cn(shell, 'cursor-text')} onMouseDown={focusControl(id)}>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <label htmlFor={id} className={labelClass}>
            {label}
          </label>
          {children}
        </div>
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} className="px-1 text-xs font-medium text-tile-danger-ink">
          {error}
        </p>
      ) : (
        hint && <p className="px-1 text-xs text-tile-muted">{hint}</p>
      )}
    </div>
  )
}

interface CommonProps {
  label: string
  error?: string
  hint?: ReactNode
  className?: string
}

function a11y(id: string, error?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}

export function TextField({
  label,
  error,
  hint,
  className,
  icon: Icon,
  ...input
}: CommonProps & InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  const id = useId()
  return (
    <FieldFrame
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
      trailing={Icon && <Icon size={17} className="shrink-0 text-tile-muted" aria-hidden />}
    >
      <input className={valueClass} {...a11y(id, error)} {...input} />
    </FieldFrame>
  )
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ...textarea
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint} className={className}>
      <textarea
        rows={3}
        className={cn(valueClass, 'resize-none text-sm leading-relaxed font-normal')}
        {...a11y(id, error)}
        {...textarea}
      />
    </FieldFrame>
  )
}

export interface SelectOption {
  value: string
  label: string
}

/**
 * Tile/Field/Select — shows the chosen option's label with a chevron; the
 * native select sits on top, invisible, so a press anywhere opens it.
 */
export function SelectField({
  label,
  error,
  hint,
  className,
  options,
  onChange,
  ...select
}: CommonProps & SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  const id = useId()
  const [uncontrolled, setUncontrolled] = useState(
    String(select.defaultValue ?? options[0]?.value ?? ''),
  )
  const current = select.value === undefined ? uncontrolled : String(select.value)
  return (
    <FieldFrame
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
      trailing={
        <ChevronDown
          size={17}
          className="pointer-events-none shrink-0 text-tile-muted"
          aria-hidden
        />
      }
    >
      <span className={cn(valueClass, 'pointer-events-none truncate')} aria-hidden>
        {options.find((o) => o.value === current)?.label}
      </span>
      <select
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
        {...a11y(id, error)}
        {...select}
        onChange={(e) => {
          setUncontrolled(e.target.value)
          onChange?.(e)
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  )
}

/**
 * Tile/Field/Date — shows the formatted date (`30 Oct, 2026`) with a calendar
 * icon; the native date input sits on top, invisible, and opens the picker.
 */
export function DateField({
  label,
  error,
  hint,
  className,
  display,
  ...input
}: CommonProps & InputHTMLAttributes<HTMLInputElement> & { display: string }) {
  const id = useId()
  return (
    <FieldFrame
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
      trailing={
        <Calendar size={17} className="pointer-events-none shrink-0 text-tile-muted" aria-hidden />
      }
    >
      <span className={cn(valueClass, 'pointer-events-none')} aria-hidden>
        {display}
      </span>
      <input
        type="date"
        className="absolute inset-0 cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        {...a11y(id, error)}
        {...input}
      />
    </FieldFrame>
  )
}
