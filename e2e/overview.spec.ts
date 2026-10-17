import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

async function withDesignData(page: Page) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [...designClients().invoices, designInvoice()],
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  // Mobile shows the four most recent until "See all".
  const seeAll = page.getByRole('button', { name: 'See all' })
  if (await seeAll.isVisible()) await seeAll.click()
}

const row = (page: Page, number: string) => page.getByRole('listitem').filter({ hasText: number })

test('summary adds up billed, paid and unpaid', async ({ page }) => {
  await withDesignData(page)
  const summary = page.getByRole('region', { name: 'Summary' })
  await expect(summary).toContainText('$272,460.00')
  await expect(summary).toContainText('$266,060.00')
  await expect(summary).toContainText('$6,400.00')
})

test('filters and search narrow the list', async ({ page }) => {
  await withDesignData(page)
  await page
    .getByRole('button', { name: /^Overdue/ })
    .first()
    .click()
  await expect(row(page, 'INV-0004')).toBeVisible()
  await expect(row(page, 'INV-0042')).toHaveCount(0)

  await page.getByRole('button', { name: /^All/ }).click()
  if (!(await page.getByRole('searchbox').isVisible()))
    await page.getByRole('button', { name: 'Search invoices' }).click()
  await page.getByRole('searchbox').fill('lumen')
  await expect(row(page, 'INV-0008')).toBeVisible()
  await expect(row(page, 'INV-0004')).toHaveCount(0)
})

test('row menu marks an overdue invoice as paid, with undo', async ({ page }) => {
  await withDesignData(page)
  await page.getByRole('button', { name: 'Actions for INV-0004' }).click()
  await page.getByRole('menuitem', { name: /Mark as paid/ }).click()
  await page
    .getByRole('dialog', { name: 'Mark as paid' })
    .getByRole('button', { name: 'Mark as paid' })
    .click()
  await expect(page.getByRole('status')).toContainText('INV-0004 marked as paid')
  await expect(row(page, 'INV-0004')).toContainText('Paid')

  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  await expect(row(page, 'INV-0004')).toContainText('Overdue')
})

test('row menu deletes with confirmation and undo', async ({ page }) => {
  await withDesignData(page)
  await page.getByRole('button', { name: 'Actions for INV-0042' }).click()
  await page.getByRole('menuitem', { name: 'Delete invoice' }).click()
  await page
    .getByRole('dialog', { name: 'Delete INV-0042?' })
    .getByRole('button', { name: 'Delete invoice' })
    .click()
  await expect(row(page, 'INV-0042')).toHaveCount(0)
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  await expect(row(page, 'INV-0042')).toBeVisible()
})

test('row menu sends a draft and opens an invoice', async ({ page }) => {
  await withDesignData(page)
  await page.getByRole('button', { name: 'Actions for INV-0042' }).click()
  await page.getByRole('menuitem', { name: /Mark as sent/ }).click()
  await expect(row(page, 'INV-0042')).toContainText('Sent')
  await page.getByRole('link', { name: /Northwind Studio.*INV-0042/ }).click()
  await expect(page).toHaveURL('/invoices/inv-42')
})

test('period switches the range', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop period menu')
  await withDesignData(page)
  await page.getByRole('button', { name: 'Last 6 months' }).click()
  await page.getByRole('menuitem', { name: 'All time' }).click()
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText('All time')
})
