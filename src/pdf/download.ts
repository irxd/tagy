import type { TemplateId } from '@/db/types'
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
  const blob = await renderInvoicePdf(view, template)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = pdfFileName(view.number)
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
