import { addDays, dueDateFor } from '@/domain/dates'
import { db } from './db'
import type { Client, Invoice, LineItem, PaymentTerms } from './types'

/*
 * "Explore with sample data": six clients and about 42 invoices over the
 * last six months, so every part of the Overview has something to show.
 * Everything is flagged `sample: true` and numbered DEMO-…, so it never
 * uses up real invoice numbers and clears in one go.
 */

const CLIENTS: [string, string, PaymentTerms][] = [
  ['Northwind Studio', 'billing@northwind.co', 'net14'],
  ['Acme Co.', 'ap@acme.co', 'net14'],
  ['Lumen Bakery', 'orders@lumen.bakery', 'net7'],
  ['Harbor & Field', 'hello@harborfield.com', 'net30'],
  ['Mono Ventures', 'finance@mono.vc', 'net30'],
  ['Okta Kitchen', 'team@oktakitchen.com', 'net14'],
]

const CATALOGUE: [string, string, number][] = [
  ['Brand identity design', 'Logo, color system, typography', 480_000],
  ['Website design & build', '8 responsive pages, CMS setup', 720_000],
  ['Strategy workshop', 'Half-day remote session', 15_000],
  ['Design hour', '', 9_500],
  ['Art direction', 'Campaign shoot, two days', 160_000],
  ['Monthly retainer', 'Design support, up to 20 hours', 290_000],
  ['Packaging design', 'Three SKUs, print-ready files', 210_000],
]

/** Small deterministic generator so the sample is the same every time. */
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1_103_515_245 + 12_345) % 2_147_483_648
    return s / 2_147_483_648
  }
}

export function generateSampleData(
  today: string,
  currency: string,
  now = new Date().toISOString(),
) {
  const rnd = random(42)
  const clients: Client[] = CLIENTS.map(([name, email, terms], i) => ({
    id: `sample-client-${i + 1}`,
    name,
    contact: '',
    email,
    address: '',
    taxId: '',
    currency: null,
    terms,
    archived: false,
    sample: true,
    createdAt: now,
    updatedAt: now,
  }))

  const invoices: Invoice[] = []
  for (let n = 1; n <= 42; n++) {
    // Spread over ~180 days, oldest first.
    const issueDate = addDays(today, -Math.round(((42 - n) / 42) * 175) - 2)
    const client = clients[Math.floor(rnd() * clients.length)]!
    const terms = client.terms!
    const dueDate = dueDateFor(issueDate, terms)
    const items: LineItem[] = Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, k) => {
      const [title, description, rate] = CATALOGUE[Math.floor(rnd() * CATALOGUE.length)]!
      return {
        id: `sample-${n}-${k}`,
        title,
        description,
        qty: rate < 20_000 ? 2 + Math.floor(rnd() * 6) : 1,
        rate,
      }
    })
    // Recent invoices are still open: two drafts, a few sent, two overdue.
    const status: Invoice['status'] =
      n >= 41 ? 'draft' : n >= 34 || n === 30 || n === 27 ? 'sent' : 'paid'
    invoices.push({
      id: `sample-invoice-${n}`,
      number: `DEMO-${String(n).padStart(4, '0')}`,
      status,
      clientId: client.id,
      issueDate,
      // Two are overdue on purpose; other open invoices fall due in the coming weeks.
      dueDate:
        n === 30 || n === 27
          ? addDays(today, -6 - n / 3)
          : status === 'paid'
            ? dueDate
            : addDays(today, 3 + (n % 4) * 5),
      terms,
      currency,
      items,
      discountPct: n % 7 === 0 ? 5 : 0,
      taxPct: 0,
      applyTax: false,
      showPaymentDetails: true,
      reference: '',
      notes: 'Thank you for your business!',
      paymentDetails: '',
      templateId: 'bold',
      sentAt: status === 'draft' ? null : `${issueDate}T10:00:00.000Z`,
      paidAt: status === 'paid' ? addDays(issueDate, 3 + Math.floor(rnd() * 10)) : null,
      paidMethod: status === 'paid' ? 'Bank transfer' : '',
      paidNote: '',
      dateFormat: 'dd MMM, yyyy',
      businessOverride: null,
      clientSnapshot: null,
      businessSnapshot: null,
      sample: true,
      createdAt: `${issueDate}T09:00:00.000Z`,
      updatedAt: `${issueDate}T09:00:00.000Z`,
    })
  }
  return { clients, invoices }
}

export async function addSampleData(today: string, currency: string): Promise<void> {
  const { clients, invoices } = generateSampleData(today, currency)
  await db.transaction('rw', [db.clients, db.invoices], async () => {
    await db.clients.bulkPut(clients)
    await db.invoices.bulkPut(invoices)
  })
}

export async function clearSampleData(): Promise<void> {
  await db.transaction('rw', [db.clients, db.invoices], async () => {
    await db.invoices.filter((i) => i.sample === true).delete()
    await db.clients.filter((c) => c.sample === true).delete()
  })
}

export async function hasSampleData(): Promise<boolean> {
  return (await db.invoices.filter((i) => i.sample === true).count()) > 0
}
