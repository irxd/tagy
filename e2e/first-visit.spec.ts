import { expect, test } from '@playwright/test'

test('first visit offers to create an invoice or explore sample data', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Create your first invoice in about 2 minutes' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No invoices yet' })).toBeVisible()

  await page.getByRole('button', { name: 'Explore with sample data' }).click()
  const banner = page.getByRole('region', { name: 'Sample data' })
  await expect(banner).toBeVisible()
  await expect(page.getByRole('region', { name: 'Summary' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Overdue/ }).first()).toContainText('2')

  await banner.getByRole('button', { name: 'Remove sample data' }).click()
  await expect(page.getByRole('heading', { name: 'No invoices yet' })).toBeVisible()
})

test('create first invoice opens the editor', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Create first invoice' }).click()
  await expect(page).toHaveURL(/\/invoices\/[\w-]{36}/)
})

test('setup checklist links to business details and ticks them off', async ({ page, isMobile }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Business details/ }).click()
  await expect(page).toHaveURL(isMobile ? '/settings/business' : '/settings')
  await page.getByLabel('Business name', { exact: true }).fill('Irsya Studio')
  await page.waitForTimeout(700)
  await page.goto('/')
  await expect(
    page.getByRole('link', { name: /Business details/ }).getByLabel('Done'),
  ).toBeVisible()
})
