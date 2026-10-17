import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true })
const hero = (page: Page) => page.getByRole('region', { name: 'Invoice' })

test.skip(({ isMobile }) => isMobile, 'the mobile editor has its own spec')

async function openDesignInvoice(page: Page, patch: object = {}) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [...designClients().invoices, designInvoice(patch)],
  })
  await page.goto('/invoices/inv-42')
  await expect(page.getByText('INV-0042 · autosaved in this browser')).toBeVisible()
}

test('a new invoice gets the next number and autosaves items', async ({ page }) => {
  await page.goto('/invoices/new')
  await expect(page).toHaveURL(/\/invoices\/[\w-]{36}/)
  await expect(field(page, 'Invoice no.')).toHaveValue('INV-0001')

  await page.getByRole('button', { name: 'Add item' }).first().click()
  await field(page, 'Item 1 name').fill('Logo design')
  await field(page, 'Item 1 quantity').fill('2')
  await field(page, 'Item 1 rate').fill('1250.50')
  await expect(hero(page)).toContainText('$2,501.00')

  await page.waitForTimeout(600)
  await page.reload()
  await expect(field(page, 'Item 1 name')).toHaveValue('Logo design')
  await expect(field(page, 'Item 1 rate')).toHaveValue('$1,250.50')
})

test('totals follow the design example and react to edits', async ({ page }) => {
  await openDesignInvoice(page)
  const summary = page.getByRole('region', { name: 'Summary' })
  await expect(summary).toContainText('$12,927.60')
  await expect(summary).toContainText('−$630.00')

  await page.getByRole('switch', { name: 'Apply tax (8%)' }).click()
  await expect(summary).toContainText('$11,970.00')

  await field(page, 'Item 3 quantity').fill('5')
  await expect(summary).toContainText('$12,112.50')
})

test('tax can be set on the invoice without a rate in Settings', async ({ page }) => {
  await page.goto('/clients')
  await seed(page, { settings: [{ ...designSettings(), defaultTaxPct: 0 }] })
  await page.goto('/invoices/new')
  await expect(page.getByRole('switch', { name: 'Apply tax' })).toBeDisabled()

  await page.getByRole('button', { name: 'Add item' }).first().click()
  await field(page, 'Item 1 rate').fill('100')
  await field(page, 'Tax').fill('10')
  const summary = page.getByRole('region', { name: 'Summary' })
  await expect(summary).toContainText('$110.00')
  await expect(page.getByRole('switch', { name: 'Apply tax (10%)' })).toBeChecked()

  await field(page, 'Tax').fill('')
  await expect(summary).not.toContainText('$110.00')
  await expect(page.getByRole('switch', { name: 'Apply tax' })).toBeDisabled()
})

test('due date follows issue date and terms', async ({ page }) => {
  await openDesignInvoice(page)
  await field(page, 'Terms').selectOption('net30')
  await expect(page.getByLabel('Due date', { exact: true })).toHaveValue('2026-11-15')
})

test('duplicate invoice numbers are rejected inline', async ({ page }) => {
  await openDesignInvoice(page)
  await field(page, 'Invoice no.').fill('INV-0001')
  await expect(page.getByText('INV-0001 is already used')).toBeVisible()
})

test('status flow: sent, paid with undo, back to draft', async ({ page }) => {
  await openDesignInvoice(page)
  await page.getByRole('button', { name: 'Mark as sent' }).click()
  await expect(page.getByRole('button', { name: /Status: Sent/ })).toBeVisible()

  await hero(page).getByRole('button', { name: 'Mark as paid' }).click()
  const dialog = page.getByRole('dialog', { name: 'Mark as paid' })
  await dialog.getByRole('button', { name: 'Due date' }).click()
  await dialog.getByLabel('Note (optional)').fill('Chase ref 88213')
  await dialog.getByRole('button', { name: 'Mark as paid' }).click()

  await expect(page.getByText('Paid on 30 Oct, 2026')).toBeVisible()
  await expect(page.getByText('Bank transfer · Chase ref 88213')).toBeVisible()

  await hero(page).getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: /Status: Sent/ })).toBeVisible()
  await page.getByRole('button', { name: 'Back to draft' }).click()
  await expect(page.getByRole('button', { name: /Status: Draft/ })).toBeVisible()
})

test('status menu goes straight from draft to paid', async ({ page }) => {
  await openDesignInvoice(page)
  await page.getByRole('button', { name: /Status: Draft/ }).click()
  await page.getByRole('menuitem', { name: /^Paid/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Mark as paid' }).click()
  await expect(page.getByRole('button', { name: /Status: Paid/ })).toBeVisible()
})

test('client picker saves a new client by name', async ({ page }) => {
  await openDesignInvoice(page)
  await hero(page).getByRole('button', { name: 'Change' }).click()
  await page.getByRole('searchbox', { name: 'Search or type a new client' }).fill('Fern & Fable')
  await page.getByRole('button', { name: /Add “Fern & Fable”/ }).click()
  await expect(hero(page)).toContainText('Fern & Fable')
  await expect(page.getByRole('status')).toContainText('Fern & Fable saved as a client')
})

test('duplicate opens a copy with the next number', async ({ page }) => {
  await openDesignInvoice(page)
  await page.getByRole('button', { name: 'Duplicate' }).click()
  await expect(page.getByRole('status')).toContainText('Duplicated as INV-0043')
  await expect(field(page, 'Invoice no.')).toHaveValue('INV-0043')
  await expect(field(page, 'Item 1 name')).toHaveValue('Brand identity design')
})

test('recent items add a line from another invoice', async ({ page }) => {
  await openDesignInvoice(page)
  await page.getByRole('button', { name: 'Recent items' }).click()
  await page.getByRole('menuitem', { name: /^Work/ }).click()
  await expect(field(page, 'Item 4 name')).toHaveValue('Work')
})

test('the live preview follows edits', async ({ page }) => {
  await openDesignInvoice(page)
  const preview = page.getByRole('article', { name: 'Invoice INV-0042' })
  await expect(preview).toContainText('$12,927.60')
  await expect(preview).toContainText('Northwind Studio')

  await field(page, 'Item 1 name').fill('Brand identity system')
  await field(page, 'Discount').fill('0')
  await expect(preview).toContainText('Brand identity system')
  await expect(preview).toContainText('$13,608.00')
  await expect(preview).not.toContainText('Discount (')
})

test('full preview opens the whole page and closes', async ({ page }) => {
  await openDesignInvoice(page)
  await page.getByRole('button', { name: 'Full preview', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Preview · INV-0042' })
  await expect(dialog.getByRole('article')).toContainText('Payment details')
  // The page frame must fit the whole invoice (and scroll), not clip its bottom.
  const [frame, invoice] = await dialog
    .getByRole('article')
    .evaluate((el: HTMLElement) => [el.parentElement!.offsetHeight, el.offsetHeight])
  expect(frame).toBeGreaterThanOrEqual(invoice!)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})
