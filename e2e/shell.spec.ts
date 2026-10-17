import { expect, test } from '@playwright/test'

const pages = [
  { label: 'Templates', path: '/templates' },
  { label: 'Clients', path: '/clients' },
  { label: 'Settings', path: '/settings' },
  { label: 'Overview', path: '/' },
]

test('opens on Overview', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  await expect(page).toHaveTitle(/Tagy/)
})

test('main navigation reaches every area', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Main' })

  for (const { label, path } of pages) {
    const link = nav.getByRole('link', { name: label })
    await link.click()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1, name: label })).toBeVisible()
    await expect(link).toHaveAttribute('aria-current', 'page')
  }
})

test('the invoice editor highlights no navigation item', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the mobile editor hides the tab bar')
  await page.goto('/invoices/new')
  await expect(page).toHaveURL(/\/invoices\/[\w-]{36}/)
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible()
  await expect(nav.locator('[aria-current]')).toHaveCount(0)
})

test('deep links survive a reload', async ({ page }) => {
  await page.goto('/clients')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Clients' })).toBeVisible()
})

test('unknown paths show the not-found page', async ({ page }) => {
  await page.goto('/nope')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
})

test('layout follows the 1024 px breakpoint', async ({ page }, testInfo) => {
  await page.goto('/')
  const isDesktop = testInfo.project.name.startsWith('desktop')
  // The rail's brand mark only exists in the desktop shell.
  await expect(page.getByRole('link', { name: 'Tagy home' })).toHaveCount(isDesktop ? 1 : 0)
})

test('mobile editor hides the tab bar', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile layout only')
  await page.goto('/invoices/new')
  await expect(page.getByRole('heading', { level: 1, name: 'New invoice' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0)
})
