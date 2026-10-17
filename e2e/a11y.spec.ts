import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

/*
 * Automated WCAG 2.2 AA checks (axe) on every main screen, desktop and
 * mobile. Invoice documents are excluded: they mirror the printed design.
 */

async function withDesignData(page: Page) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [...designClients().invoices, designInvoice()],
  })
}

async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('article[aria-label^="Invoice"]')
    .analyze()
  const serious = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([])
}

for (const [name, path] of [
  ['overview', '/'],
  ['editor', '/invoices/inv-42'],
  ['templates', '/templates'],
  ['clients', '/clients'],
  ['settings', '/settings'],
] as const) {
  test(`${name} has no serious accessibility issues`, async ({ page }) => {
    await withDesignData(page)
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForTimeout(300)
    await audit(page)
  })
}

test('first visit has no serious accessibility issues', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Create your first invoice/ })).toBeVisible()
  await audit(page)
})
