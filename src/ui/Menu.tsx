import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from './cn'

/*
 * Tile/Menu, Menu Item, Menu Divider on Radix DropdownMenu: keyboard
 * navigation, typeahead, focus return and outside-click close come free.
 */

export function Menu({
  trigger,
  children,
  align = 'end',
}: {
  /** A single focusable element; it receives the open/close behaviour. */
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'end'
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          collisionPadding={16}
          className="z-50 flex w-[280px] flex-col gap-0.5 rounded-tile-lg border border-tile-border bg-tile-panel p-1.5 shadow-tile-overlay"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function MenuItem({
  icon: Icon,
  label,
  description,
  selected,
  tone = 'fg',
  onSelect,
}: {
  icon: LucideIcon
  label: string
  description?: string
  /** Shows the trailing check, e.g. the current status. */
  selected?: boolean
  tone?: 'fg' | 'danger'
  onSelect: () => void
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-[9px] outline-none select-none',
        'data-[highlighted]:bg-tile-tile',
        tone === 'danger' ? 'text-tile-danger-ink' : 'text-tile-fg',
      )}
    >
      <Icon size={17} className="shrink-0" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-sm font-semibold">{label}</span>
        {description && <span className="text-xs text-tile-muted">{description}</span>}
      </span>
      {selected && <Check size={16} className="shrink-0 text-tile-accent" aria-hidden />}
    </DropdownMenu.Item>
  )
}

export function MenuDivider() {
  return <DropdownMenu.Separator className="mx-2.5 my-1 h-px bg-tile-border" />
}
