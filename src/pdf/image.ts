import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

// Up to 3× the PDF's 72 dpi (≈ 216 dpi), kept under ~16 MP in total:
// Safari refuses to draw canvases larger than that.
const MAX_SCALE = 3
const MAX_PIXELS = 16_000_000

/**
 * Draws every page of the PDF and stacks them into one PNG, so the image
 * matches the downloaded PDF exactly. Loaded on demand with the PDF reader.
 */
export async function renderPdfToPng(pdf: Blob): Promise<Blob> {
  GlobalWorkerOptions.workerPort ??= new PdfWorker()
  const task = getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) })
  const doc = await task.promise
  try {
    const pages = await Promise.all(
      Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1)),
    )
    const sizes = pages.map((p) => p.getViewport({ scale: 1 }))
    const area = sizes.reduce((sum, v) => sum + v.width * v.height, 0)
    const scale = Math.min(MAX_SCALE, Math.sqrt(MAX_PIXELS / area))

    const out = document.createElement('canvas')
    const viewports = pages.map((p) => p.getViewport({ scale }))
    out.width = Math.ceil(Math.max(...viewports.map((v) => v.width)))
    out.height = Math.ceil(viewports.reduce((sum, v) => sum + v.height, 0))
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, out.width, out.height)

    let top = 0
    for (const [i, page] of pages.entries()) {
      const viewport = viewports[i]!
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      await page.render({ canvas, viewport }).promise
      ctx.drawImage(canvas, 0, top)
      top += canvas.height
    }

    return await new Promise<Blob>((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
    )
  } finally {
    await task.destroy()
  }
}
