import { useState } from 'react'
import { downloadInvoice, type DownloadFormat } from '@/pdf/download'
import { useToast } from '@/ui/toastContext'
import { useEditor } from './useEditor'
import { useInvoiceView } from './useInvoiceView'

/**
 * Download the open invoice as a PDF or a PNG image; optionally mark a draft
 * as sent afterwards. `preparing` is the format being made.
 */
export function useDownloadInvoice() {
  const { invoice, actions } = useEditor()
  const view = useInvoiceView()
  const toast = useToast()
  const [preparing, setPreparing] = useState<DownloadFormat | null>(null)

  async function download({ markSent = false, format = 'pdf' as DownloadFormat } = {}) {
    if (preparing) return
    setPreparing(format)
    try {
      await downloadInvoice(view, invoice.templateId, format)
      if (markSent && invoice.status === 'draft') await actions.send()
    } catch (error) {
      console.error(`${format.toUpperCase()} download failed`, error)
      toast({ message: `Couldn't make the ${format === 'pdf' ? 'PDF' : 'image'} — try again` })
    } finally {
      setPreparing(null)
    }
  }

  return { download, busy: preparing !== null, preparing }
}
