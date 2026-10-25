import { expect, test } from '@playwright/test'

test('previews the sample invoice before any invoice exists', async ({ page }) => {
  await page.goto('/templates')
  const preview = page.getByRole('region', { name: 'Preview' })
  await expect(preview.getByRole('article', { name: 'Invoice INV-0042' })).toContainText(
    'Northwind Studio',
  )
})

test('previews the sample rather than a blank draft', async ({ page }) => {
  await page.goto('/invoices/new')
  await page.waitForURL(/\/invoices\/[\w-]{36}/)
  await page.goto('/templates')
  const preview = page.getByRole('region', { name: 'Preview' })
  await expect(preview.getByRole('article', { name: 'Invoice INV-0042' })).toContainText(
    'Brand identity design',
  )
})

test('set as default makes new invoices use the template', async ({ page }) => {
  await page.goto('/templates')
  await page.getByRole('radio', { name: 'Editorial Mono' }).click()
  await page.getByRole('button', { name: 'Set Editorial Mono as default' }).click()
  await expect(page.getByRole('status')).toContainText('Editorial Mono is now the default')
  await expect(page.getByRole('button', { name: 'Editorial Mono is the default' })).toBeDisabled()

  await page.goto('/invoices/new')
  await page.waitForURL(/\/invoices\/[\w-]{36}/)
  await page.goto(page.url().replace(/\?.*$/, '') + '?step=review')
  await expect(
    page.getByText(/Editorial Mono · A4/).or(page.getByText('Template · Editorial Mono')),
  ).toBeVisible()
})

test('customisation saves right away and shows in the preview', async ({ page }) => {
  await page.goto('/templates')
  const preview = page.getByRole('region', { name: 'Preview' })
  await expect(preview).not.toContainText('Authorized signature')
  await page.getByRole('switch', { name: 'Signature line' }).click()
  await expect(preview).toContainText('Authorized signature')

  await page.getByRole('radio', { name: 'green' }).click()
  await page.getByRole('radio', { name: 'US Letter' }).click()
  // The picker reads settings from the database, so this waits for the save.
  await expect(page.getByRole('radio', { name: 'US Letter' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
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

test('the logo toggle is turned off for templates without a logo', async ({ page }) => {
  await page.goto('/templates')
  const logo = page.getByRole('switch', { name: /Business logo/ })
  await page.getByRole('radio', { name: 'Swiss Ledger' }).click()
  await expect(logo).toBeEnabled()
  await logo.click()
  await expect(logo).not.toBeChecked()
  await logo.click()

  await page.getByRole('radio', { name: 'Ruled Index' }).click()
  await expect(logo).toBeDisabled()
  await expect(page.getByText('Ruled Index has no place for a logo')).toBeVisible()
})

test('the Tax ID toggle shows example tax IDs when none are set', async ({ page }) => {
  await page.goto('/templates')
  const preview = page.getByRole('region', { name: 'Preview' })
  await expect(preview).toContainText('47-3829105')
  await expect(preview).toContainText('EU372819465')
  await page.getByRole('switch', { name: 'Tax ID' }).click()
  await expect(preview).not.toContainText('47-3829105')
})
