import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

/*
 * The production build under the Content-Security-Policy from
 * public/_headers (which Cloudflare Pages applies; vite preview doesn't, so
 * the test adds it). Fails if PDF, print, preview or the logo trip the CSP.
 */

const CSP = readFileSync('public/_headers', 'utf8').match(/Content-Security-Policy: (.+)/)![1]!

test.use({ baseURL: 'http://localhost:4180' })
test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium')

async function withCsp(page: Page) {
  const violations: string[] = []
  await page.exposeFunction('__cspViolation', (v: string) => {
    console.log('CSP violation:', v)
    violations.push(v)
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { __cspViolation: (v: string) => void }).__cspViolation(
        `${e.violatedDirective} ${e.blockedURI}`,
      ),
    )
  })
  await page.route('**/*', async (route) => {
    const response = await route.fetch()
    const headers = { ...response.headers() }
    if ((headers['content-type'] ?? '').includes('text/html'))
      headers['content-security-policy'] = CSP
    await route.fulfill({ response, headers })
  })
  return violations
}

test('editor, PDF download and print work under the CSP', async ({ page }) => {
  const violations = await withCsp(page)
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [designInvoice()],
  })
  // A real logo through the real upload path: resized on a canvas, stored as a blob.
  await page.goto('/settings')
  await page
    .locator('input[type=file][accept*="image/png"]')
    .setInputFiles('public/icons/icon-192.png')
  await expect(page.getByRole('img', { name: 'Your logo' })).toBeVisible()
  await page.goto('/invoices/inv-42')
  await expect(page.getByRole('article', { name: 'Invoice INV-0042' })).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PDF' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('INV-0042.pdf')

  await page.addInitScript(() => {
    window.print = () => {}
  })
  await page.getByRole('button', { name: 'Print' }).click()
  await page.waitForTimeout(1500)

  expect(violations).toEqual([])
})
