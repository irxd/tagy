import { Dexie, type EntityTable } from 'dexie'
import {
  invoiceV1toV2,
  settingsV1toV2,
  settingsV2toV3,
  settingsV3toV4,
  invoiceV4toV5,
  taxRatesV1,
} from './migrations'
import type { AppSettings, Client, Invoice, StoredBlob } from './types'

export class TagyDB extends Dexie {
  invoices!: EntityTable<Invoice, 'id'>
  clients!: EntityTable<Client, 'id'>
  settings!: EntityTable<AppSettings, 'key'>
  blobs!: EntityTable<StoredBlob, 'id'>

  constructor(name = 'tagy') {
    super(name)
    // Only indexed fields are listed. Booleans can't be IndexedDB keys, so
    // `archived` and `sample` are filtered in memory.
    this.version(1).stores({
      invoices: 'id, &number, status, clientId, issueDate, dueDate, updatedAt',
      clients: 'id, name',
      settings: 'key',
      blobs: 'id',
    })
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        const settings = await tx.table('settings').get('app')
        const rates = taxRatesV1(settings)
        await tx
          .table('invoices')
          .toCollection()
          .modify((invoice, ref) => {
            ref.value = invoiceV1toV2(invoice, rates)
          })
        if (settings) await tx.table('settings').put(settingsV1toV2(settings))
      })
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        const settings = await tx.table('settings').get('app')
        if (settings) await tx.table('settings').put(settingsV2toV3(settings))
      })
    this.version(4)
      .stores({})
      .upgrade(async (tx) => {
        const settings = await tx.table('settings').get('app')
        if (settings) await tx.table('settings').put(settingsV3toV4(settings))
      })
    this.version(5)
      .stores({})
      .upgrade(async (tx) => {
        const settings = await tx.table('settings').get('app')
        await tx
          .table('invoices')
          .toCollection()
          .modify((invoice, ref) => {
            ref.value = invoiceV4toV5(invoice, settings)
          })
      })
  }
}

export const db = new TagyDB()
