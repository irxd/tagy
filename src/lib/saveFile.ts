/** Hands a file to the browser's download (the "Save" the user sees). */
export function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke later: some browsers read the URL after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
