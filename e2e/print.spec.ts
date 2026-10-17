import { expect, test } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

test.skip(
  ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
  'Chromium print to PDF',
)

const pageCount = (pdf: Buffer) =>
  (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
const mediaBoxes = (pdf: Buffer) =>
  [...pdf.toString('latin1').matchAll(/\/MediaBox\s*\[([^\]]+)\]/g)].map((m) =>
    m[1]!.trim().split(/\s+/).map(Number),
  )

async function seedInvoice(
  page: import('@playwright/test').Page,
  patch: object = {},
  settings: object = {},
) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [{ ...designSettings(), ...settings }],
    invoices: [designInvoice(patch)],
  })
}

test('prints one A4 page for the design invoice', async ({ page }) => {
  await seedInvoice(page)
  await page.goto('/print/inv-42')
  await expect(page.getByRole('article', { name: 'Invoice INV-0042' })).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
  expect(pageCount(pdf)).toBe(1)
  const [box] = mediaBoxes(pdf)
  // A4 is 595 × 842 pt.
  expect(Math.round(box![2]!)).toBe(595)
  expect(Math.round(box![3]!)).toBe(842)
})

test('long invoices flow onto more pages, US Letter when chosen', async ({ page }) => {
  const items = Array.from({ length: 40 }, (_, i) => ({
    id: `l${i}`,
    title: `Line ${i + 1}`,
    description: 'Detail',
    qty: 1,
    rate: 10_000,
  }))
  await seedInvoice(page, { items, templateId: 'minimal' }, { paper: 'letter' })
  await page.goto('/print/inv-42')
  await expect(page.getByText('Line 40')).toBeVisible()
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
  expect(pageCount(pdf)).toBeGreaterThan(1)
  const [box] = mediaBoxes(pdf)
  // Letter is 612 × 792 pt.
  expect(Math.round(box![2]!)).toBe(612)
})

test('the Print button opens the print dialog from the editor', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      ;(window.top as unknown as { __printed?: string }).__printed = location.pathname
    }
  })
  await seedInvoice(page)
  await page.goto('/invoices/inv-42')
  await page.getByRole('button', { name: 'Print' }).click()
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __printed?: string }).__printed))
    .toBe('/print/inv-42')
})
