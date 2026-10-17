import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

const pageCount = (pdf: Buffer) =>
  (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length

async function open(page: Page, path: string, patch: object = {}) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [designInvoice(patch)],
  })
  await page.goto(path)
}

async function downloadFrom(page: Page, button: ReturnType<Page['getByRole']>) {
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
  return { name: download.suggestedFilename(), pdf: await readFile((await download.path())!) }
}

test('desktop: Download PDF saves a one-page PDF named after the invoice', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'desktop header button')
  await open(page, '/invoices/inv-42')
  const { name, pdf } = await downloadFrom(page, page.getByRole('button', { name: 'Download PDF' }))
  expect(name).toBe('INV-0042.pdf')
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pageCount(pdf)).toBe(1)
})

test('every template makes a PDF; long invoices span pages', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop header button')
  const items = Array.from({ length: 45 }, (_, i) => ({
    id: `l${i}`,
    title: `Line ${i + 1}`,
    description: '',
    qty: 1,
    rate: 1_000,
  }))
  for (const templateId of ['minimal', 'classic', 'studio'] as const) {
    await open(page, '/invoices/inv-42', { templateId, items })
    const { pdf } = await downloadFrom(page, page.getByRole('button', { name: 'Download PDF' }))
    expect(pageCount(pdf), templateId).toBeGreaterThan(1)
  }
})

test('mobile: Download PDF on Review marks the draft as sent', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile review')
  await open(page, '/invoices/inv-42?step=review')
  await expect(page.getByRole('switch', { name: 'Mark as sent after download' })).toBeChecked()
  const { name } = await downloadFrom(page, page.getByRole('button', { name: 'Download PDF' }))
  expect(name).toBe('INV-0042.pdf')
  await expect(page.getByRole('region', { name: 'Status' })).toContainText('Sent')
})

const mediaBox = (pdf: Buffer) =>
  pdf
    .toString('latin1')
    .match(/\/MediaBox\s*\[([^\]]+)\]/)![1]!
    .trim()
    .split(/\s+/)
    .map((n) => Math.round(Number(n)))

test('every template × paper size: one page of the right size', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop header button')
  const sizes = { a4: [0, 0, 595, 842], letter: [0, 0, 612, 792] }
  for (const paper of ['a4', 'letter'] as const) {
    for (const templateId of ['minimal', 'classic', 'bold', 'studio'] as const) {
      await page.goto('/clients')
      await seed(page, {
        ...designClients(),
        settings: [{ ...designSettings(), paper }],
        invoices: [designInvoice({ templateId })],
      })
      await page.goto('/invoices/inv-42')
      const { pdf } = await downloadFrom(page, page.getByRole('button', { name: 'Download PDF' }))
      expect(pageCount(pdf), `${templateId} ${paper}`).toBe(1)
      expect(mediaBox(pdf), `${templateId} ${paper}`).toEqual(sizes[paper])
    }
  }
})
