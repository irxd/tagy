import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

test.skip(({ isMobile }) => isMobile, 'flows are the same on mobile; desktop buttons are tested')

async function withDesignData(page: Page, settings: object = {}) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [{ ...designSettings(), ...settings }],
    invoices: [...designClients().invoices, designInvoice()],
  })
}

test('export, clear everything, import the same file back', async ({ page }) => {
  await withDesignData(page)
  await page.goto('/settings')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export backup' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^tagy-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const path = (await download.path())!
  const file = JSON.parse(await readFile(path, 'utf8'))
  expect(file).toMatchObject({ app: 'tagy', schemaVersion: 5 })
  expect(file.data.invoices).toHaveLength(11)
  await expect(page.getByRole('region', { name: 'Data & backup' })).toContainText('Today')

  await page.getByRole('button', { name: 'Clear all data' }).click()
  await page.getByLabel('Type “clear” to confirm').fill('clear')
  await page.getByRole('dialog').getByRole('button', { name: 'Clear all data' }).click()
  await expect(page.getByRole('region', { name: 'Data & backup' })).toContainText('Never')

  await page.locator('input[type=file][accept*="json"]').setInputFiles(path)
  const dialog = page.getByRole('dialog', { name: 'Replace everything with this backup?' })
  await expect(dialog).toContainText('11 invoices and 7 clients from Tagy Studio')
  await dialog.getByRole('button', { name: 'Replace and import' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('status')).toContainText('Imported 11 invoices and 7 clients')
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText('Tagy Studio')
})

test('a file that is not a backup is refused with a reason', async ({ page }) => {
  await page.goto('/settings')
  await page.locator('input[type=file][accept*="json"]').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": "world"}'),
  })
  await expect(page.getByRole('status')).toContainText("This file isn't a Tagy backup.")
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the reminder shows after 14 days and goes away after exporting', async ({ page }) => {
  await withDesignData(page, { lastBackupAt: new Date(Date.now() - 30 * 86_400_000).toISOString() })
  await page.goto('/')
  const reminder = page.getByRole('region', { name: 'Backup reminder' })
  await expect(reminder).toContainText('Your last backup was')
  await Promise.all([
    page.waitForEvent('download'),
    reminder.getByRole('button', { name: 'Export backup' }).click(),
  ])
  await expect(reminder).toHaveCount(0)
})
