import { useEffect } from 'react'
import { useParams } from 'react-router'
import { useBlobUrl, useClient, useInvoice, useSettings } from '@/db/hooks'
import type { Paper } from '@/db/types'
import { todayISO } from '@/domain/dates'
import { InvoiceDocument } from '@/templates/InvoiceDocument'
import { buildInvoiceView, PAGE_WIDTH } from '@/templates/view'

/** Paper width in CSS px (96 per inch). */
const PAPER_WIDTH_PX: Record<Paper, number> = {
  a4: (210 / 25.4) * 96,
  letter: 8.5 * 96,
}

const PRINT_READY = 'tagy:print-ready'

/**
 * /print/:id — the invoice alone, scaled to the paper's width, for the
 * browser's print dialog. Loaded in a hidden frame by `printInvoice`; tells
 * the parent once data and fonts are ready.
 */
export function PrintPage() {
  const { id = '' } = useParams()
  const invoice = useInvoice(id)
  const settings = useSettings()
  const client = useClient(invoice?.clientId ?? undefined)
  const logoUrl = useBlobUrl(settings?.business.logoBlobId)
  const ready = !!invoice && !!settings && (!invoice.clientId || client !== undefined)

  useEffect(() => {
    document.body.style.background = 'white'
  }, [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) window.parent.postMessage({ type: PRINT_READY, id }, window.location.origin)
    })
    return () => {
      cancelled = true
    }
  }, [ready, id])

  if (invoice === null) return <p className="p-8">This invoice no longer exists.</p>
  if (!ready) return null

  const view = buildInvoiceView({ invoice, settings, client, logoUrl, today: todayISO() })
  const paper = settings.paper
  return (
    <>
      <style>{`
        @page { size: ${paper === 'a4' ? 'A4' : 'letter'}; margin: 0; }
        html, body { margin: 0; background: white; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        thead { display: table-header-group; }
      `}</style>
      <div style={{ zoom: PAPER_WIDTH_PX[paper] / PAGE_WIDTH, width: PAGE_WIDTH }}>
        <InvoiceDocument template={invoice.templateId} view={view} />
      </div>
    </>
  )
}
