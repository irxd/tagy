import { Dexie, type EntityTable } from 'dexie'
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
  }
}

export const db = new TagyDB()
