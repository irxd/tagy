import type { LucideIcon } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useRef, type ReactNode } from 'react'
import { Drawer } from 'vaul'
import { Button, type ButtonVariant } from './Button'
import { cn } from './cn'
import { useLayout } from './useLayout'

/*
 * Dialogs on desktop become bottom sheets on mobile (handoff: "Dialogs on
 * desktop → bottom sheets on mobile"). Both trap focus, close on Escape and
 * return focus to whatever was focused when they opened. They're opened from
 * code (menus, buttons) rather than a Radix Trigger, so focus return is ours.
 */

export interface OverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  /** Tinted icon tile above the title, e.g. trash for delete. */
  icon?: LucideIcon
  tone?: 'default' | 'danger' | 'success'
  children?: ReactNode
  /** Buttons; laid out in a right-aligned row (desktop) or a full-width stack (mobile). */
  actions?: ReactNode
}

const iconTones = {
  default: 'bg-tile-accent-soft text-tile-accent',
  danger: 'bg-tile-danger-soft text-tile-danger',
  success: 'bg-tile-success-soft text-tile-success',
}

export function Overlay(props: OverlayProps) {
  const returnFocus = useReturnFocus(props.open)
  return useLayout() === 'desktop' ? (
    <CenteredDialog {...props} returnFocus={returnFocus} />
  ) : (
    <BottomSheet {...props} returnFocus={returnFocus} />
  )
}

/** Remembers the focused element when `open` turns true; returns a close handler. */
function useReturnFocus(open: boolean) {
  const previous = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (open) previous.current = document.activeElement as HTMLElement | null
  }, [open])
  return (event: Event) => {
    event.preventDefault()
    if (previous.current?.isConnected) previous.current.focus()
  }
}

type InnerProps = OverlayProps & { returnFocus: (event: Event) => void }

function CenteredDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  tone = 'default',
  children,
  actions,
  returnFocus,
}: InnerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-tile-fg/30" />
        <Dialog.Content
          // Radix wants an explicit undefined when there is no Description.
          {...(!description && { 'aria-describedby': undefined })}
          onCloseAutoFocus={returnFocus}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-48px)] w-[420px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-[18px] overflow-y-auto rounded-tile-xl bg-tile-panel p-6 shadow-[0_4px_8px_#0000000f,0_24px_64px_#1a1f2b33] focus:outline-none"
        >
          {Icon && (
            <span className={cn('grid size-11 place-items-center rounded-[13px]', iconTones[tone])}>
              <Icon size={20} aria-hidden />
            </span>
          )}
          <div className="flex flex-col gap-2">
            <Dialog.Title className="text-xl font-bold tracking-[-0.4px] text-tile-fg">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm leading-[1.55] text-tile-muted">
                {description}
              </Dialog.Description>
            )}
          </div>
          {children}
          {actions && <div className="flex justify-end gap-2">{actions}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  tone = 'default',
  children,
  actions,
  returnFocus,
}: InnerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-tile-fg/35" />
        <Drawer.Content
          {...(!description && { 'aria-describedby': undefined })}
          onCloseAutoFocus={returnFocus}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-tile-panel px-5 pt-2.5 pb-[max(34px,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_#1a1f2b2e] focus:outline-none"
        >
          <div className="mx-auto h-[5px] w-10 shrink-0 rounded-[3px] bg-tile-border-strong" />
          {Icon && (
            <span className={cn('grid size-12 place-items-center rounded-[14px]', iconTones[tone])}>
              <Icon size={22} aria-hidden />
            </span>
          )}
          <div className="flex flex-col gap-2">
            <Drawer.Title className="text-[22px] font-bold tracking-[-0.5px] text-tile-fg">
              {title}
            </Drawer.Title>
            {description && (
              <Drawer.Description className="text-[15px] leading-[1.55] text-tile-muted">
                {description}
              </Drawer.Description>
            )}
          </div>
          {children}
          {actions && <div className="flex flex-col-reverse gap-2 pt-1">{actions}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export interface ConfirmProps extends Omit<OverlayProps, 'actions'> {
  confirmLabel: string
  confirmIcon?: LucideIcon
  confirmVariant?: ButtonVariant
  cancelLabel?: string
  onConfirm: () => void
}

/** Confirm pattern from the delete designs: icon, title, text, Cancel + primary action. */
export function ConfirmDialog({
  confirmLabel,
  confirmIcon,
  confirmVariant = 'danger',
  cancelLabel = 'Cancel',
  onConfirm,
  ...overlay
}: ConfirmProps) {
  const size = useLayout() === 'desktop' ? 'md' : 'lg'
  return (
    <Overlay
      {...overlay}
      actions={
        <>
          <Button size={size} variant="soft" onClick={() => overlay.onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            size={size}
            variant={confirmVariant}
            icon={confirmIcon}
            onClick={() => {
              onConfirm()
              overlay.onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
