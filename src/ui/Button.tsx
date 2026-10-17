import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'dark' | 'soft' | 'outline' | 'danger' | 'danger-soft'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-tile-accent text-white hover:bg-tile-accent-ink',
  dark: 'bg-tile-fg text-white hover:bg-tile-fg/90',
  soft: 'bg-tile-tile text-tile-fg hover:bg-tile-tile-strong',
  outline: 'border border-tile-border-strong bg-tile-panel text-tile-fg hover:bg-tile-tile',
  danger: 'bg-tile-danger text-white hover:bg-tile-danger/90',
  'danger-soft': 'bg-tile-danger-soft text-tile-danger hover:bg-tile-danger/15',
}

const sizes = {
  // Tile/Button/* — 35 px tall pill.
  md: 'gap-[7px] py-[9px] pr-4 pl-[13px] text-sm',
  // Mobile sheet and action bar buttons — 49 px, full width.
  lg: 'w-full justify-center gap-2 px-4 py-[15px] text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: keyof typeof sizes
  icon?: LucideIcon
  children: ReactNode
}

/** Tile/Button/Primary · Dark · Soft · Outline, plus Danger from the delete dialog. */
export function Button({
  variant = 'soft',
  size = 'md',
  icon: Icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap transition-colors [&>svg]:shrink-0',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === 'lg' ? 17 : 15} aria-hidden />}
      {children}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  /** Required: icon-only buttons need an accessible name. */
  label: string
}

/** Tile/Icon Button — 36 px round, soft fill. */
export function IconButton({
  icon: Icon,
  label,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-tile-tile text-tile-fg transition-colors hover:bg-tile-tile-strong',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent',
        className,
      )}
      {...props}
    >
      <Icon size={16} aria-hidden />
    </button>
  )
}
