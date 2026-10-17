const PRINT_READY = 'tagy:print-ready'

/**
 * Opens the browser's print dialog for one invoice without leaving the page:
 * loads /print/:id in a hidden frame, waits for it to report ready (data and
 * fonts loaded), prints the frame, then removes it.
 */
export function printInvoice(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe')
    frame.title = 'Print preview'
    frame.setAttribute('aria-hidden', 'true')
    Object.assign(frame.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      visibility: 'hidden',
    })

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(timeout)
      // Some browsers return from print() before the dialog closes; wait a beat.
      setTimeout(() => frame.remove(), 1000)
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== frame.contentWindow || event.data?.type !== PRINT_READY) return
      cleanup()
      try {
        frame.contentWindow!.focus()
        frame.contentWindow!.print()
        resolve()
      } catch (error) {
        reject(error)
      }
    }

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('The invoice took too long to prepare for printing.'))
    }, 15_000)

    window.addEventListener('message', onMessage)
    frame.src = `/print/${encodeURIComponent(id)}`
    document.body.appendChild(frame)
  })
}
