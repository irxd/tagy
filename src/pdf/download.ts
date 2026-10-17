import type { TemplateId } from '@/db/types'
import { saveFile } from '@/lib/saveFile'
import type { InvoiceView } from '@/templates/view'

/** `INV-0042.pdf`; characters that are unsafe in file names become dashes. */
export function pdfFileName(number: string): string {
  return `${number.replace(/[\\/:*?"<>|\s]+/g, '-') || 'invoice'}.pdf`
}

/**
 * Makes the PDF and saves it. The PDF engine and its fonts load on first
 * use only (code-split), so the app's first load stays small.
 */
export async function downloadInvoicePdf(view: InvoiceView, template: TemplateId): Promise<void> {
  const { renderInvoicePdf } = await import('./render')
  saveFile(await renderInvoicePdf(view, template), pdfFileName(view.number))
}
