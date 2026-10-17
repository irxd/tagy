import { pdf } from '@react-pdf/renderer'
import type { TemplateId } from '@/db/types'
import type { InvoiceView } from '@/templates/view'
import { registerFonts } from './fonts'
import { InvoicePdf } from './InvoicePdf'

/** Renders the invoice to a PDF file (a Blob). Loaded on demand with the PDF engine. */
export async function renderInvoicePdf(view: InvoiceView, template: TemplateId): Promise<Blob> {
  registerFonts()
  return pdf(<InvoicePdf view={view} template={template} />).toBlob()
}
