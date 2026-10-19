import { ChevronLeft, Download, LayoutTemplate, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useSaveStatus } from '@/app/saveStatus'
import { createInvoice } from '@/db/invoices'
import type { TemplateId } from '@/db/types'
import { TEMPLATE_LABELS } from '@/features/settings/options'
import { Button } from '@/ui/Button'
import { DropdownButton } from '@/ui/Chip'
import { Menu, MenuItem } from '@/ui/Menu'
import { useToast } from '@/ui/toastContext'
import { useLayout } from '@/ui/useLayout'
import { printInvoice } from '@/features/print/printInvoice'
import { MobileEditor } from './MobileEditor'
import { useDownloadPdf } from './useDownloadPdf'
import { PreviewPane } from './preview'
import { DetailsFields, ItemsCard, NotesCard, PaymentCard, SummaryCard } from './sections'
import { HeroSummary, StatusMenu } from './StatusControls'
import { EditorContext, useEditor, useEditorState } from './useEditor'

/** /invoices/new — creates a Draft with the next number, then opens it. */
export function NewInvoicePage() {
  const navigate = useNavigate()
  // StrictMode runs effects twice in development; create only once.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    // Mobile starts the step flow at Client; desktop ignores the step.
    void createInvoice().then((inv) => {
      // Ask the browser to keep this site's storage (it may still say no);
      // persisted storage isn't cleared under storage pressure.
      void navigator.storage?.persist?.()
      navigate(`/invoices/${inv.id}?step=client`, { replace: true })
    })
  }, [navigate])
  return null
}

/** /invoices/:id */
export function EditorPage() {
  const { id = '' } = useParams()
  const editor = useEditorState(id)
  const layout = useLayout()
  if (editor === undefined) return null
  if (editor === null) return <Navigate to="/" replace />
  return (
    <EditorContext.Provider value={editor}>
      {layout === 'desktop' ? <DesktopEditor /> : <MobileEditor />}
    </EditorContext.Provider>
  )
}

function DesktopEditor() {
  const [previewOpen, setPreviewOpen] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      <EditorHeader />
      <section
        aria-label="Invoice"
        className="flex gap-6 rounded-tile-lg border border-tile-border p-5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-[26px]">
          <HeroSummary onPreview={() => setPreviewOpen(true)} />
          <div className="flex flex-col gap-3.5 px-1">
            <h2 className="text-lg font-bold tracking-[-0.3px]">Details</h2>
            <DetailsFields />
          </div>
        </div>
        <PreviewPane expanded={previewOpen} onExpandedChange={setPreviewOpen} />
      </section>
      <div className="flex items-start gap-4">
        <ItemsCard className="flex-1" />
        <SummaryCard className="w-[400px] shrink-0" />
      </div>
      <div className="grid grid-cols-2 items-start gap-4">
        <NotesCard />
        <PaymentCard />
      </div>
    </div>
  )
}

function EditorHeader() {
  const { invoice, set } = useEditor()
  const toast = useToast()
  const pdf = useDownloadPdf()
  const save = useSaveStatus()
  const saved = { saving: 'saving…', saved: 'autosaved in this browser', error: "couldn't save" }[
    save
  ]
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <Link
          to="/"
          className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full border border-tile-border-strong bg-tile-panel py-2 pr-4 pl-3 text-sm font-semibold text-tile-fg transition-colors hover:bg-tile-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent"
        >
          <ChevronLeft size={16} aria-hidden />
          Back to overview
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="truncate text-[34px] leading-tight font-bold tracking-[-1.3px]">
            {invoice.status === 'draft' ? 'New invoice' : invoice.number}
          </h1>
          <StatusMenu />
        </div>
        <p className="text-base text-tile-muted" aria-live="polite">
          {invoice.number} · {saved}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Menu
          trigger={
            <DropdownButton aria-label={`Template: ${TEMPLATE_LABELS[invoice.templateId]}`}>
              Template · {TEMPLATE_LABELS[invoice.templateId]}
            </DropdownButton>
          }
        >
          {(Object.keys(TEMPLATE_LABELS) as TemplateId[]).map((t) => (
            <MenuItem
              key={t}
              icon={LayoutTemplate}
              label={TEMPLATE_LABELS[t]}
              selected={invoice.templateId === t}
              onSelect={() => set({ templateId: t })}
            />
          ))}
        </Menu>
        <Button
          icon={Printer}
          onClick={() =>
            printInvoice(invoice.id).catch(() =>
              toast({ message: "Couldn't open printing — try again" }),
            )
          }
        >
          Print
        </Button>
        <Button
          variant="primary"
          icon={Download}
          disabled={pdf.busy}
          onClick={() => void pdf.download()}
        >
          {pdf.busy ? 'Preparing…' : 'Download PDF'}
        </Button>
      </div>
    </header>
  )
}
