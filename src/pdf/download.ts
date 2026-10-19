import type { TemplateId } from '@/db/types'
import { saveFile } from '@/lib/saveFile'
import type { InvoiceView } from '@/templates/view'

export type DownloadFormat = 'pdf' | 'png'

/** `INV-0042.pdf`; characters that are unsafe in file names become dashes. */
export function invoiceFileName(number: string, format: DownloadFormat = 'pdf'): string {
  return `${number.replace(/[\\/:*?"<>|\s]+/g, '-') || 'invoice'}.${format}`
}

/**
 * Makes the PDF (or a PNG of its pages) and saves it. The PDF engine, its
 * fonts and the PDF reader load on first use only (code-split), so the
 * app's first load stays small.
 */
export async function downloadInvoice(
  view: InvoiceView,
  template: TemplateId,
  format: DownloadFormat = 'pdf',
): Promise<void> {
  const { renderInvoicePdf } = await import('./render')
  const pdf = await renderInvoicePdf(view, template)
  if (format === 'pdf') return saveFile(pdf, invoiceFileName(view.number))
  const { renderPdfToPng } = await import('./image')
  saveFile(await renderPdfToPng(pdf), invoiceFileName(view.number, 'png'))
}
