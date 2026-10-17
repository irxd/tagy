import { useState } from 'react'
import { downloadInvoicePdf } from '@/pdf/download'
import { useToast } from '@/ui/toastContext'
import { useEditor } from './useEditor'
import { useInvoiceView } from './useInvoiceView'

/** Download the open invoice as a PDF; optionally mark a draft as sent afterwards. */
export function useDownloadPdf() {
  const { invoice, actions } = useEditor()
  const view = useInvoiceView()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function download({ markSent = false } = {}) {
    if (busy) return
    setBusy(true)
    try {
      await downloadInvoicePdf(view, invoice.templateId)
      if (markSent && invoice.status === 'draft') await actions.send()
    } catch (error) {
      console.error('PDF download failed', error)
      toast({ message: "Couldn't make the PDF — try again" })
    } finally {
      setBusy(false)
    }
  }

  return { download, busy }
}
