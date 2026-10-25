import { expect, test, type Page } from '@playwright/test'
import { designClients, designInvoice, designSettings, seed } from './support/seed.ts'

async function withDesignData(page: Page) {
  await page.goto('/clients')
  await seed(page, {
    ...designClients(),
    settings: [designSettings()],
    invoices: [...designClients().invoices, designInvoice()],
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
}

const row = (page: Page, number: string) => page.getByRole('listitem').filter({ hasText: number })

test('summary adds up billed, paid and unpaid', async ({ page }) => {
  await withDesignData(page)
  const summary = page.getByRole('region', { name: 'Summary' })
  await expect(summary).toContainText('$272,460.00')
  await expect(summary).toContainText('$266,060.00')
  await expect(summary).toContainText('$6,400.00')
})

test('filters and search narrow the list', async ({ page }) => {
  await withDesignData(page)
  await page
    .getByRole('button', { name: /^Overdue/ })
    .first()
    .click()
  await expect(row(page, 'INV-0004')).toBeVisible()
  await expect(row(page, 'INV-0042')).toHaveCount(0)

  await page.getByRole('button', { name: /^All/ }).click()
  if (!(await page.getByRole('searchbox').isVisible()))
    await page.getByRole('button', { name: 'Search invoices' }).click()
  await page.getByRole('searchbox').fill('lumen')
  await expect(row(page, 'INV-0008')).toBeVisible()
  await expect(row(page, 'INV-0004')).toHaveCount(0)
})

test('row menu marks an overdue invoice as paid, with undo', async ({ page }) => {
  await withDesignData(page)
  await page.getByRole('button', { name: 'Actions for INV-0004' }).click()
  await page.getByRole('menuitem', { name: /Mark as paid/ }).click()
  await page
    .getByRole('dialog', { name: 'Mark as paid' })
    .getByRole('button', { name: 'Mark as paid' })
    .click()
  await expect(page.getByRole('status')).toContainText('INV-0004 marked as paid')
  await expect(row(page, 'INV-0004')).toContainText('Paid')

  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  await expect(row(page, 'INV-0004')).toContainText('Overdue')
})

test('row menu deletes with confirmation and undo', async ({ page }) => {
  await withDesignData(page)
  await page.getByRole('button', { name: 'Actions for INV-0042' }).click()
  await page.getByRole('menuitem', { name: 'Delete invoice' }).click()
  await page
    .getByRole('dialog', { name: 'Delete INV-0042?' })
    .getByRole('button', { name: 'Delete invoice' })
    .click()
  await expect(row(page, 'INV-0042')).toHaveCount(0)
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  await expect(row(page, 'INV-0042')).toBeVisible()
})

test('row menu sends a draft and opens an invoice', async ({ page }) => {
  await withDesignData(page)
  await page.getByRole('button', { name: 'Actions for INV-0042' }).click()
  await page.getByRole('menuitem', { name: /Mark as sent/ }).click()
  await expect(row(page, 'INV-0042')).toContainText('Sent')
  await page.getByRole('link', { name: /Northwind Studio.*INV-0042/ }).click()
  await expect(page).toHaveURL('/invoices/inv-42')
})

test('period switches the range', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop period menu')
  await withDesignData(page)
  await page.getByRole('button', { name: 'Last 6 months' }).click()
  await page.getByRole('menuitem', { name: 'All time' }).click()
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText('All time')
})

test('Export CSV downloads the period’s invoices', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop hero button')
  await withDesignData(page)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^tagy-invoices-\d{4}-\d{2}-\d{2}\.csv$/)
  const text = (await import('node:fs')).readFileSync((await download.path())!, 'utf8')
  const lines = text.replace(/^﻿/, '').trim().split('\r\n')
  expect(lines[0]).toMatch(/^Number,Status,Client/)
  expect(lines).toHaveLength(12)
  expect(text).toContain('INV-0042,draft,Northwind Studio')
})

test('the list pages through invoices and remembers the page size', async ({ page, isMobile }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore with sample data' }).click()
  const list = page.getByRole('region', { name: 'Invoices' })
  await expect(list.getByRole('listitem')).toHaveCount(10)
  // How many sample invoices fall in the period depends on today's date,
  // so read the total from the All filter instead of fixing it.
  const total = Number(
    (await list.getByRole('button', { name: /^All/ }).textContent())!.match(/\d+/)![0],
  )
  const pages = Math.ceil(total / 10)
  expect(pages).toBeGreaterThan(2)
  await expect(list).toContainText(`1–10 of ${total}`)

  await list.getByRole('button', { name: 'Next page' }).click()
  await expect(list).toContainText(`11–20 of ${total}`)
  if (!isMobile) {
    await list.getByRole('button', { name: `Page ${pages}` }).click()
    await expect(list).toContainText(`${(pages - 1) * 10 + 1}–${total} of ${total}`)
    await expect(list.getByRole('button', { name: 'Next page' })).toBeDisabled()
  }

  // A filter starts again from page 1.
  await list.getByRole('button', { name: /^Paid/ }).click()
  await expect(list).toContainText(/1–10 of \d+/)
  await expect(list.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  // With 10 or fewer matches there's no pager.
  await list.getByRole('button', { name: /^Draft/ }).click()
  await expect(list.getByRole('listitem').first()).toBeVisible()
  await expect(list.getByRole('navigation', { name: 'Pages' })).toHaveCount(0)

  await list.getByRole('button', { name: /^All/ }).click()
  await list.getByLabel('Invoices per page').selectOption('25')
  await expect(list.getByRole('listitem')).toHaveCount(25)
  await page.reload()
  await expect(list).toContainText(`1–25 of ${total}`)
})
