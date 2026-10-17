import { db } from './db'
import type { Client } from './types'

export type NewClient = Pick<Client, 'name'> &
  Partial<Omit<Client, 'id' | 'name' | 'createdAt' | 'updatedAt'>>
export type ClientPatch = Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>

/** Clients sorted by name; archived ones only when asked for. */
export async function listClients({ includeArchived = false } = {}): Promise<Client[]> {
  const all = await db.clients.orderBy('name').toArray()
  return includeArchived ? all : all.filter((c) => !c.archived)
}

export function getClient(id: string): Promise<Client | undefined> {
  return db.clients.get(id)
}

export async function createClient(input: NewClient): Promise<Client> {
  const now = new Date().toISOString()
  const client: Client = {
    contact: '',
    email: '',
    address: '',
    taxId: '',
    currency: null,
    terms: null,
    archived: false,
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  await db.clients.add(client)
  return client
}

export async function updateClient(id: string, patch: ClientPatch): Promise<void> {
  await db.clients.update(id, { ...patch, updatedAt: new Date().toISOString() })
}

export function setClientArchived(id: string, archived: boolean): Promise<void> {
  return updateClient(id, { archived })
}

export async function deleteClient(id: string): Promise<void> {
  await db.clients.delete(id)
}
