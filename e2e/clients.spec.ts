import { expect, test, type Page } from '@playwright/test'
import { designClients, seed } from './support/seed.ts'

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true })

/** Desktop shows cards (buttons), mobile shows list rows (also buttons). */
const clientButton = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name.replace(/[.&]/g, '\\$&')}`) })

async function withDesignData(page: Page) {
  await page.goto('/clients')
  await seed(page, designClients())
  await page.reload()
  await expect(clientButton(page, 'Acme Co.')).toBeVisible()
}

test('empty state adds the first client', async ({ page }) => {
  await page.goto('/clients')
  await expect(page.getByRole('heading', { name: 'No clients yet' })).toBeVisible()
  await page.getByRole('button', { name: 'Add client' }).click()

  await page.getByRole('button', { name: 'Save client' }).click()
  await expect(page.getByText('Add a name for this client')).toBeVisible()

  await field(page, 'Business name').fill('Fern & Fable Co.')
  await field(page, 'Email').fill('hello@fernfable.co')
  await page.getByRole('button', { name: 'Save client' }).click()

  await expect(page.getByRole('status')).toContainText('Fern & Fable Co. saved')
  await expect(clientButton(page, 'Fern & Fable Co.')).toBeVisible()
  await expect(page).toHaveURL('/clients')
})

test('filters, counts and search', async ({ page }) => {
  await withDesignData(page)
  await expect(page.getByRole('button', { name: /^All/ })).toContainText('6')

  await page.getByRole('button', { name: /^With unpaid/ }).click()
  await expect(clientButton(page, 'Acme Co.')).toBeVisible()
  await expect(clientButton(page, 'Mono Ventures')).toHaveCount(0)

  await page.getByRole('button', { name: /^Archived/ }).click()
  await expect(clientButton(page, 'Old Client Ltd')).toBeVisible()

  await page.getByRole('button', { name: /^All/ }).click()
  if ((await page.getByRole('searchbox', { name: 'Search clients' }).count()) === 0) {
    await page.getByRole('button', { name: 'Search clients' }).click()
  }
  await page.getByRole('searchbox', { name: 'Search clients' }).fill('lumen')
  await expect(clientButton(page, 'Lumen Bakery')).toBeVisible()
  await expect(clientButton(page, 'Acme Co.')).toHaveCount(0)
})

test('shows unpaid, billed and the overdue hint from invoices', async ({ page }) => {
  await withDesignData(page)
  const acme = clientButton(page, 'Acme Co.')
  await expect(acme).toContainText('$3,140.00')
  await expect(acme).toContainText('Overdue')
  await expect(clientButton(page, 'Mono Ventures')).toContainText('All paid')
  await expect(clientButton(page, 'Northwind Studio')).toContainText('Draft ready')
})

test('edits a client and archives it with undo', async ({ page }) => {
  await withDesignData(page)
  await clientButton(page, 'Lumen Bakery').click()
  await expect(page.getByRole('heading', { name: 'Edit client' })).toBeVisible()
  await field(page, 'Contact person').fill('Sam Baker')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('heading', { name: 'Edit client' })).toHaveCount(0)

  await clientButton(page, 'Lumen Bakery').click()
  await expect(field(page, 'Contact person')).toHaveValue('Sam Baker')
  await page.getByRole('button', { name: 'Archive client' }).click()
  await expect(page.getByRole('status')).toContainText('Lumen Bakery archived')
  await expect(clientButton(page, 'Lumen Bakery')).toHaveCount(0)

  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click()
  await expect(clientButton(page, 'Lumen Bakery')).toBeVisible()
})

test('a client without invoices can be deleted', async ({ page }) => {
  await page.goto('/clients?client=new')
  await field(page, 'Business name').fill('Temp Client')
  await page.getByRole('button', { name: 'Save client' }).click()
  await clientButton(page, 'Temp Client').click()
  await page.getByRole('button', { name: 'Delete Temp Client' }).click()
  await expect(page.getByRole('status')).toContainText('Temp Client deleted')
  await expect(page.getByRole('heading', { name: 'No clients yet' })).toBeVisible()
})

test('mobile: the form is a sheet that Back closes', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile layout only')
  await withDesignData(page)
  await clientButton(page, 'Acme Co.').click()
  await expect(page.getByRole('dialog', { name: 'Edit client' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('mobile: the sheet scrolls no further than its content', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile layout only')
  await page.goto('/clients?client=new')
  const sheet = page.getByRole('dialog', { name: 'New client' })
  await expect(sheet).toBeVisible()
  // vaul's ::after below the sheet must not add blank scroll space.
  const extra = await sheet.evaluate((el) => {
    const scroller = [el, ...el.querySelectorAll('*')].find(
      (n) => getComputedStyle(n).overflowY === 'auto',
    )!
    const content = [...scroller.children].reduce(
      (end, c) => Math.max(end, (c as HTMLElement).offsetTop + (c as HTMLElement).offsetHeight),
      0,
    )
    return scroller.scrollHeight - content
  })
  expect(extra).toBeLessThan(40)
})
