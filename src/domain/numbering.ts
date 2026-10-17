/** `INV-` + 42 → `INV-0042`. Pads to 4 digits; longer numbers keep all digits. */
export function formatInvoiceNumber(prefix: string, n: number): string {
  return `${prefix}${String(n).padStart(4, '0')}`
}
