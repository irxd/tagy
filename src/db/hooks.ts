import { useLiveQuery } from 'dexie-react-hooks'
import { getClient, listClients } from './clients'
import { getInvoice, listInvoices } from './invoices'
import { getSettings } from './settings'

// Live queries re-render the calling component whenever the data they read
// changes, in this tab or another. `undefined` means still loading.

export function useSettings() {
  return useLiveQuery(getSettings)
}

export function useClients(options: { includeArchived?: boolean } = {}) {
  const { includeArchived = false } = options
  return useLiveQuery(() => listClients({ includeArchived }), [includeArchived])
}

export function useClient(id: string | undefined) {
  return useLiveQuery(() => (id ? getClient(id) : undefined), [id])
}

export function useInvoices() {
  return useLiveQuery(listInvoices)
}

export function useInvoice(id: string | undefined) {
  return useLiveQuery(() => (id ? getInvoice(id) : undefined), [id])
}
