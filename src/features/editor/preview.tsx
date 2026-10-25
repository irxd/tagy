import { ImageDown, Maximize2, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'
import { InvoiceDocument } from '@/templates/InvoiceDocument'
import { PAGE_WIDTH, type InvoiceView } from '@/templates/view'
import { Button } from '@/ui/Button'
import { cn } from '@/ui/cn'
import { useDownloadInvoice } from './useDownloadInvoice'
import { useEditor } from './useEditor'
import { useInvoiceView } from './useInvoiceView'

/** Width of an element, kept up to date. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** The page, scaled with CSS zoom so text stays crisp at any size. */
export function ScaledPage({ view, zoom }: { view: InvoiceView; zoom: number }) {
  const { invoice } = useEditor()
  return (
    <div
      className="shrink-0 overflow-hidden rounded-[4px] bg-white shadow-[0_1px_2px_#1a1f2b14,0_8px_24px_#1a1f2b14]"
      style={{ zoom }}
    >
      <InvoiceDocument template={invoice.templateId} view={view} />
    </div>
  )
}

/**
 * Live preview beside the form (desktop) — the whole page under its chips.
 * It's kept to the window's height, so a long invoice scrolls inside it, and
 * narrows on smaller screens to leave the form room.
 */
export function PreviewPane({
  expanded,
  onExpandedChange,
  className,
}: {
  expanded: boolean
  onExpandedChange: (open: boolean) => void
  className?: string
}) {
  const view = useInvoiceView()
  const [ref, width] = useWidth<HTMLDivElement>()
  return (
    <div
      className={cn(
        'relative flex max-h-[calc(100dvh-40px)] w-[clamp(300px,31vw,440px)] shrink-0 flex-col overflow-hidden rounded-tile-lg bg-linear-to-b from-[#e9ecf1] to-[#dce1e8]',
        className,
      )}
    >
      <div
        ref={ref}
        className="flex min-h-0 flex-1 justify-center overflow-y-auto px-3 pt-15 pb-3 [scrollbar-width:none]"
      >
        {/* Clicking the page opens the full preview; keyboard and screen-reader
            users have the Expand button, so the page itself stays plain content. */}
        {width > 0 && (
          <div
            onClick={() => onExpandedChange(true)}
            className="h-fit cursor-zoom-in rounded-[4px] shadow-[0_10px_28px_#1a1f2b24]"
          >
            <ScaledPage view={view} zoom={width / PAGE_WIDTH} />
          </div>
        )}
      </div>
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-semibold">
        <span className="size-[7px] rounded-full bg-tile-success" aria-hidden />
        Live · {view.paper === 'a4' ? 'A4' : 'Letter'}
      </span>
      <button
        type="button"
        aria-label="Expand preview"
        onClick={() => onExpandedChange(true)}
        className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-tile-fg hover:bg-white focus-visible:outline-2 focus-visible:outline-tile-accent"
      >
        <Maximize2 size={16} aria-hidden />
      </button>
      <PreviewDialog open={expanded} onOpenChange={onExpandedChange} view={view} />
    </div>
  )
}

/** Full preview: the whole page, as large as the window allows. */
export function PreviewDialog({
  open,
  onOpenChange,
  view,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  view: InvoiceView
}) {
  const download = useDownloadInvoice()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-tile-fg/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-tile-xl bg-tile-canvas focus:outline-none desk:inset-6"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 desk:px-6">
            <Dialog.Title className="text-[17px] font-bold tracking-[-0.3px]">
              Preview · {view.number}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              <Button
                icon={ImageDown}
                disabled={download.busy}
                onClick={() => void download.download({ format: 'png' })}
              >
                {download.preparing === 'png' ? 'Preparing…' : 'Save image'}
              </Button>
              <Dialog.Close
                aria-label="Close preview"
                className="grid size-9 place-items-center rounded-full bg-tile-panel hover:bg-tile-tile focus-visible:outline-2 focus-visible:outline-tile-accent"
              >
                <X size={16} aria-hidden />
              </Dialog.Close>
            </div>
          </header>
          <FitWidth view={view} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FitWidth({ view }: { view: InvoiceView }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  // Fill the width on phones; cap at 1.3× (≈ 728 px) on large screens.
  const zoom = width ? Math.min(1.3, (width - 32) / PAGE_WIDTH) : 1
  return (
    // min-h-0 lets this area shrink and scroll; items-start keeps the page at
    // its own height instead of stretching it to (and clipping it at) the window.
    <div
      ref={ref}
      className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 pb-6"
    >
      {width > 0 && <ScaledPage view={view} zoom={zoom} />}
    </div>
  )
}
