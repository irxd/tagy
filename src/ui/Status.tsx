import type { LucideIcon } from 'lucide-react'
import { ChevronDown, CircleCheck, CircleDashed } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { DisplayStatus } from '@/domain/status'
import { cn } from './cn'

const tones: Record<DisplayStatus, { label: string; chip: string; dot: string }> = {
  draft: { label: 'Draft', chip: 'bg-tile-tile text-tile-muted', dot: 'bg-tile-muted' },
  sent: { label: 'Sent', chip: 'bg-tile-accent-soft text-tile-accent-ink', dot: 'bg-tile-accent' },
  paid: {
    label: 'Paid',
    chip: 'bg-tile-success-soft text-tile-success-ink',
    dot: 'bg-tile-success',
  },
  overdue: {
    label: 'Overdue',
    chip: 'bg-tile-danger-soft text-tile-danger-ink',
    dot: 'bg-tile-danger',
  },
}

/**
 * Tile/Status/Draft · Sent · Paid · Overdue — dot + label pill. `label`
 * reuses a tone with other words (a client's "All paid"); `sm` is the
 * compact pill in mobile list rows.
 */
export function StatusBadge({
  status,
  label,
  size = 'md',
  className,
}: {
  status: DisplayStatus
  label?: string
  size?: 'md' | 'sm'
  className?: string
}) {
  const tone = tones[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
        size === 'md'
          ? 'py-[5px] pr-[11px] pl-[9px] text-[13px]'
          : 'py-[3px] pr-2 pl-[7px] text-[11px]',
        tone.chip,
        className,
      )}
    >
      <span className={cn('size-[7px] rounded-full', tone.dot)} aria-hidden />
      {label ?? tone.label}
    </span>
  )
}

/** Tile/Status Select — a status badge that opens the status menu. */
export const StatusSelect = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { status: DisplayStatus }
>(function StatusSelect({ status, className, ...props }, ref) {
  const tone = tones[status]
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Status: ${tone.label}. Change status`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-tile-border-strong py-[5px] pr-2 pl-2.5 text-[13px] font-semibold',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent',
        tone.chip,
        className,
      )}
      {...props}
    >
      <span className={cn('size-[7px] rounded-full', tone.dot)} aria-hidden />
      {tone.label}
      <ChevronDown size={14} aria-hidden />
    </button>
  )
})

export interface StepProps {
  label: string
  /** Short date like `16 Oct`, or null while the step hasn't happened. */
  date: string | null
  done: boolean
  /** Icon for a completed step; pending steps show a dashed circle. */
  icon?: LucideIcon
  /** Colours the icon and label of the current step (Sent, Overdue, Paid). */
  tone?: 'fg' | 'accent' | 'danger' | 'success'
}

const stepTones = {
  fg: 'text-tile-fg',
  accent: 'text-tile-accent',
  danger: 'text-tile-danger-ink',
  success: 'text-tile-success-ink',
}

/** Tile/Step — progress bar over icon, label and date. */
export function Step({ label, date, done, icon: Icon = CircleCheck, tone = 'fg' }: StepProps) {
  const StepIcon = done ? Icon : CircleDashed
  const color = done ? stepTones[tone] : undefined
  return (
    <li className="flex min-w-0 flex-1 flex-col gap-2">
      <span className={cn('h-1 rounded-sm', done ? 'bg-tile-fg' : 'bg-tile-tile-strong')} />
      <span className="flex items-center gap-[7px]">
        <StepIcon size={15} className={color ?? 'shrink-0 text-tile-subtle'} aria-hidden />
        <span className={cn('text-[13px] font-bold', color ?? 'text-tile-muted')}>{label}</span>
        <span className="truncate text-xs text-tile-muted">{date ?? '—'}</span>
      </span>
    </li>
  )
}

/** Tile/Status Stepper — Created → Sent → Paid, filled up to the current step. */
export function StatusStepper({ steps }: { steps: StepProps[] }) {
  return (
    <ol aria-label="Invoice progress" className="flex w-full gap-2">
      {steps.map((step) => (
        <Step key={step.label} {...step} />
      ))}
    </ol>
  )
}
