import { useBlobUrl } from '@/db/hooks'
import { buildInvoiceView, type InvoiceView } from '@/templates/view'
import { useEditor } from './useEditor'

/** The open invoice as its template sees it. */
export function useInvoiceView(): InvoiceView {
  const { invoice, settings, client, today } = useEditor()
  const logoUrl = useBlobUrl(settings.business.logoBlobId)
  return buildInvoiceView({ invoice, settings, client, logoUrl, today })
}
