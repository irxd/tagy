import { Check } from 'lucide-react'
import { Checkbox as RadixCheckbox, Switch } from 'radix-ui'
import { useId, type ReactNode } from 'react'
import { cn } from './cn'

interface ControlProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: ReactNode
  disabled?: boolean
  className?: string
}

const row = 'inline-flex items-center gap-2.5 text-sm font-semibold text-tile-fg'
const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent'

/** Tile/Toggle/On · Off — 38×22 track. */
export function Toggle({ checked, onCheckedChange, children, disabled, className }: ControlProps) {
  const id = useId()
  return (
    <span className={cn(row, disabled && 'opacity-50', className)}>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors',
          'bg-tile-tile-strong data-[state=checked]:bg-tile-accent',
          focus,
        )}
      >
        <Switch.Thumb className="size-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4" />
      </Switch.Root>
      <label htmlFor={id}>{children}</label>
    </span>
  )
}

/** Tile/Checkbox/On · Off — 20 px rounded box, ink when checked. */
export function Checkbox({
  checked,
  onCheckedChange,
  children,
  disabled,
  className,
}: ControlProps) {
  const id = useId()
  return (
    <span className={cn(row, disabled && 'opacity-50', className)}>
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-md bg-tile-tile-strong data-[state=checked]:bg-tile-fg',
          focus,
        )}
      >
        <RadixCheckbox.Indicator>
          <Check size={13} strokeWidth={3} className="text-white" aria-hidden />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id}>{children}</label>
    </span>
  )
}
