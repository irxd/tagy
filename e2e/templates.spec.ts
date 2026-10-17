import { expect, test } from '@playwright/test'

test('previews the sample invoice before any invoice exists', async ({ page }) => {
  await page.goto('/templates')
  const preview = page.getByRole('region', { name: 'Preview' })
  await expect(preview.getByRole('article', { name: 'Invoice INV-0042' })).toContainText(
    'Northwind Studio',
  )
})

test('set as default makes new invoices use the template', async ({ page }) => {
  await page.goto('/templates')
  await page.getByRole('radio', { name: 'Studio' }).click()
  await page.getByRole('button', { name: 'Set Studio as default' }).click()
  await expect(page.getByRole('status')).toContainText('Studio is now the default')
  await expect(page.getByRole('button', { name: 'Studio is the default' })).toBeDisabled()

  await page.goto('/invoices/new')
  await page.waitForURL(/\/invoices\/[\w-]{36}/)
  await page.goto(page.url().replace(/\?.*$/, '') + '?step=review')
  await expect(page.getByText(/Studio · A4/).or(page.getByText('Template · Studio'))).toBeVisible()
})

test('customisation saves right away and shows in the preview', async ({ page }) => {
  await page.goto('/templates')
  const preview = page.getByRole('region', { name: 'Preview' })
  await expect(preview).not.toContainText('Authorized signature')
  await page.getByRole('switch', { name: 'Signature line' }).click()
  await expect(preview).toContainText('Authorized signature')

  await page.getByRole('radio', { name: 'green' }).click()
  await page.getByRole('radio', { name: 'US Letter' }).click()
  await page.reload()
  await expect(page.getByRole('radio', { name: 'green' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('radio', { name: 'US Letter' })).toHaveAttribute(
    'aria-checked',
    'true',
  )

  await page.getByRole('button', { name: /^Reset/ }).click()
  await expect(page.getByRole('radio', { name: 'A4' })).toHaveAttribute('aria-checked', 'true')
  await expect(preview).not.toContainText('Authorized signature')
})
