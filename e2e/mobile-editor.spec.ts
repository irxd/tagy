import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

test.skip(({ isMobile }) => !isMobile, 'mobile layout only')

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true })
const next = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true })

async function withDesignData(page: Page) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [...designClients().invoices, designInvoice()],
  })
}

test('a new invoice walks Client → Details → Items → Review', async ({ page }) => {
  await withDesignData(page)
  await page.goto('/invoices/new')
  await expect(page).toHaveURL(/step=client/)
  await expect(page.getByRole('heading', { name: 'Who is this invoice for?' })).toBeVisible()

  await page.getByRole('radio', { name: /Lumen Bakery/ }).click()
  await expect(page.getByRole('radio', { name: /Lumen Bakery/ })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await next(page, 'Details').click()

  await expect(page.getByRole('heading', { name: 'Invoice details' })).toBeVisible()
  await page.getByRole('button', { name: 'Net 30' }).click()
  await expect(page.getByText('Due in 30 days')).toBeVisible()
  await next(page, 'Items').click()

  await page.getByRole('button', { name: 'Add item' }).click()
  await field(page, 'Item 1 name').fill('Sourdough order')
  await field(page, 'Item 1 rate').fill('40')
  await page.getByRole('button', { name: 'Increase item 1 quantity' }).click()
  await expect(page.getByText('$80.00').first()).toBeVisible()
  await next(page, 'Review').click()

  await expect(page.getByRole('heading', { name: 'Review & download' })).toBeVisible()
  await expect(page.getByRole('article')).toContainText('Lumen Bakery')
  await expect(page.getByRole('article')).toContainText('Sourdough order')

  await page.goBack()
  await expect(page).toHaveURL(/step=items/)
})

test('an existing invoice opens on Review with its status', async ({ page }) => {
  await withDesignData(page)
  await page.goto('/invoices/inv-4')
  const status = page.getByRole('region', { name: 'Status' })
  await expect(status).toContainText('Overdue')
  await expect(status).toContainText('days late')

  await page.getByRole('button', { name: 'Mark as paid' }).click()
  await page
    .getByRole('dialog', { name: 'Mark as paid' })
    .getByRole('button', { name: 'Mark as paid' })
    .click()
  await expect(status).toContainText('Paid on')
})

test('delete asks first and offers undo', async ({ page }) => {
  await withDesignData(page)
  await page.goto('/invoices/inv-4')
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Delete INV-0004?' })
    .getByRole('button', { name: 'Delete invoice' })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('status')).toContainText('INV-0004 deleted')
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  // Wait for the restore to be saved before opening it, or the editor finds nothing.
  await expect(page.getByRole('link', { name: /INV-0004/ })).toBeVisible()
  await page.goto('/invoices/inv-4')
  await expect(page.getByRole('region', { name: 'Status' })).toBeVisible()
})

test('review switches template and accent', async ({ page }) => {
  await withDesignData(page)
  await page.goto('/invoices/inv-42?step=review')
  await page.getByRole('radio', { name: 'green' }).click()
  await expect(page.getByRole('radio', { name: 'green' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: 'Serif Ledger' }).click()
  await expect(page.getByText('Serif Ledger · A4')).toBeVisible()
})

test('business details and date format can change on the invoice', async ({ page }) => {
  await withDesignData(page)
  await page.goto('/invoices/inv-42?step=client')
  await expect(page.getByText('Bill to', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit your business' }).click()
  const sheet = page.getByRole('dialog', { name: 'Your business' })
  await sheet.getByLabel('Tax ID').fill('99-0000001')
  await sheet.getByRole('button', { name: 'Done' }).click()

  await next(page, 'Details').click()
  await field(page, 'Date format').selectOption('yyyy-MM-dd')
  await next(page, 'Items').click()
  await next(page, 'Review').click()
  const invoice = page.getByRole('article', { name: 'Invoice INV-0042' })
  await expect(invoice).toContainText('99-0000001')
  await expect(invoice).toContainText('2026-10-16')
})
