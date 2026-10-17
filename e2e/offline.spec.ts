import { expect, test } from '@playwright/test'

// Runs against the production build (vite preview), where the service worker is active.
test.use({ baseURL: 'http://localhost:4180' })
test.skip(({ browserName }) => browserName !== 'chromium', 'service worker check in Chromium')

test('opens with no network after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  // The worker installs on the first visit and controls pages from the next load.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  await page.goto('/templates')
  await expect(page.getByRole('heading', { level: 1, name: 'Templates' })).toBeVisible()
  await context.setOffline(false)
})

test('publishes a web app manifest', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({ short_name: 'Tagy', display: 'standalone' })
})
