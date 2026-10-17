import { expect, test, type Page } from '@playwright/test'

const isDesktop = (name: string) => name.startsWith('desktop')
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true })

/** Waits for autosave to write (the indicator settles back to "All changes saved"). */
async function saved(page: Page) {
  await expect(page.getByText('All changes saved')).toBeVisible()
  await page.waitForTimeout(600)
}

test('business profile and defaults autosave and survive a reload', async ({ page }, testInfo) => {
  const desktop = isDesktop(testInfo.project.name)

  await page.goto(desktop ? '/settings' : '/settings/business')
  await field(page, 'Business name').fill('Tagy Studio')
  await field(page, 'Email').fill('hello@tagy.studio')
  if (!desktop) {
    await saved(page)
    await page.goto('/settings/defaults')
  }
  await field(page, 'Number prefix').fill('TG-')
  await field(page, 'Next number').fill('43')
  await expect(page.getByText('TG-0043')).toBeVisible()
  await field(page, 'Tax rate (%)').fill('8')
  await saved(page)

  await page.reload()
  await expect(field(page, 'Number prefix')).toHaveValue('TG-')
  await expect(field(page, 'Next number')).toHaveValue('0043')
  await expect(field(page, 'Tax rate (%)')).toHaveValue('8')
  if (!desktop) await page.goto('/settings/business')
  await expect(field(page, 'Business name')).toHaveValue('Tagy Studio')
})

test('invalid input shows an inline error', async ({ page }, testInfo) => {
  await page.goto(isDesktop(testInfo.project.name) ? '/settings' : '/settings/business')
  await field(page, 'Email').fill('not-an-email')
  await expect(page.getByText('Check this email address')).toBeVisible()
})

test('mobile settings is a grouped list that opens sub-pages', async ({ page }, testInfo) => {
  test.skip(isDesktop(testInfo.project.name), 'mobile layout only')
  await page.goto('/settings')
  await page.getByRole('link', { name: /Invoice defaults/ }).click()
  await expect(page).toHaveURL('/settings/defaults')
  await expect(page.getByRole('heading', { level: 1, name: 'Invoice defaults' })).toBeVisible()
  await page.getByRole('link', { name: 'Back' }).click()
  await expect(page).toHaveURL('/settings')
})

test('desktop redirects sub-pages to the full settings page', async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), 'desktop layout only')
  await page.goto('/settings/defaults')
  await expect(page).toHaveURL('/settings')
})

test('clear all data needs the typed confirmation', async ({ page }, testInfo) => {
  const desktop = isDesktop(testInfo.project.name)
  await page.goto(desktop ? '/settings' : '/settings/business')
  await field(page, 'Business name').fill('Tagy Studio')
  await saved(page)
  if (!desktop) await page.goto('/settings')

  await page
    .getByRole('button', { name: /Clear all data/ })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: 'Clear all data?' })
  const confirm = dialog.getByRole('button', { name: 'Clear all data' })
  await expect(confirm).toBeDisabled()
  await dialog.getByLabel('Type “clear” to confirm').fill('clear')
  await confirm.click()

  await expect(page.getByRole('status')).toContainText('All data cleared')
  if (!desktop) await page.goto('/settings/business')
  await expect(field(page, 'Business name')).toHaveValue('')
})
