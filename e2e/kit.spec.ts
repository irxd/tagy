import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/kit')
  await expect(page.getByRole('heading', { level: 1, name: 'Tile kit' })).toBeVisible()
})

test('confirm dialog closes on Escape and returns focus', async ({ page }, testInfo) => {
  const trigger = page.getByRole('button', { name: 'Delete dialog' })
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Delete INV-0041?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Delete invoice' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  // Safari doesn't focus buttons on tap, so there is nothing to return to there.
  if (testInfo.project.name.startsWith('desktop')) await expect(trigger).toBeFocused()
})

test('confirming shows a toast with Undo that announces politely', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete dialog' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete invoice' }).click()

  const status = page.getByRole('status')
  await expect(status).toHaveAttribute('aria-live', 'polite')
  await expect(status).toContainText('INV-0041 deleted')
  await status.getByRole('button', { name: 'Undo' }).click()
  await expect(status).not.toContainText('INV-0041 deleted')
})

test('menu opens from the keyboard and runs an item', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'keyboard flow is desktop only')
  await page.getByRole('button', { name: 'Invoice actions' }).focus()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem')).toHaveCount(6)
  await menu.getByRole('menuitem', { name: /Delete invoice/ }).click()
  await expect(page.getByRole('dialog', { name: 'Delete INV-0041?' })).toBeVisible()
})

test('status select marks the current status', async ({ page }) => {
  await page.getByRole('button', { name: /Status: Draft/ }).click()
  await page.getByRole('menuitem', { name: 'Paid' }).click()
  await expect(page.getByRole('button', { name: /Status: Paid/ })).toBeVisible()
})
