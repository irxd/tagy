import { readFile } from 'node:fs/promises'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

const PNG_SIGNATURE = '89504e470d0a1a0a'

/** Width and height from the PNG's IHDR chunk. */
const pngSize = (png: Buffer) => [png.readUInt32BE(16), png.readUInt32BE(20)]

async function open(page: Page, path: string, patch: object = {}) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [designInvoice(patch)],
  })
  await page.goto(path)
}

async function downloadFrom(page: Page, trigger: Locator) {
  const [download] = await Promise.all([page.waitForEvent('download'), trigger.click()])
  return { name: download.suggestedFilename(), png: await readFile((await download.path())!) }
}

test('desktop: Image saves a PNG of the A4 page named after the invoice', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'desktop header button')
  await open(page, '/invoices/inv-42')
  const { name, png } = await downloadFrom(page, page.getByRole('button', { name: 'Image' }))
  expect(name).toBe('INV-0042.png')
  expect(png.subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE)
  const [width, height] = pngSize(png)
  // A4 (595.28 pt) at 3× 72 dpi.
  expect(width).toBe(1786)
  expect(height! / width!).toBeCloseTo(842 / 595, 2)
})

test('long invoices stack every page into one image', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop header button')
  const items = Array.from({ length: 45 }, (_, i) => ({
    id: `l${i}`,
    title: `Line ${i + 1}`,
    description: '',
    qty: 1,
    rate: 1_000,
  }))
  await open(page, '/invoices/inv-42', { items })
  const { png } = await downloadFrom(page, page.getByRole('button', { name: 'Image' }))
  const [width, height] = pngSize(png)
  expect(height! / width!).toBeGreaterThan((2 * 842) / 595 - 0.01)
})

test('the full preview saves an image', async ({ page, isMobile }) => {
  await open(page, isMobile ? '/invoices/inv-42?step=review' : '/invoices/inv-42')
  await page
    .getByRole('button', { name: isMobile ? 'Preview' : 'Expand preview', exact: true })
    .click()
  const { name } = await downloadFrom(page, page.getByRole('button', { name: 'Save image' }))
  expect(name).toBe('INV-0042.png')
})

test('overview: the row menu downloads an image', async ({ page }) => {
  await open(page, '/')
  await page.getByRole('button', { name: 'Actions for INV-0042' }).first().click()
  const { name } = await downloadFrom(page, page.getByRole('menuitem', { name: 'Download image' }))
  expect(name).toBe('INV-0042.png')
})
