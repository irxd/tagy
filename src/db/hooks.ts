import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo } from 'react'
import { getClient, listClients } from './clients'
import { db } from './db'
import { getInvoice, listInvoices } from './invoices'
import { countRecords } from './maintenance'
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

export function useRecordCounts() {
  return useLiveQuery(countRecords)
}

/** Object URL for a stored blob (e.g. the logo), revoked when it changes or unmounts. */
export function useBlobUrl(id: string | null | undefined): string | null {
  const blob = useLiveQuery(() => (id ? db.blobs.get(id) : undefined), [id])
  const url = useMemo(() => (blob ? URL.createObjectURL(blob.data) : null), [blob])
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])
  return url
}
