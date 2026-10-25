import { Check, ContactRound, Search, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/db/clients'
import { useClients, useSettings } from '@/db/hooks'
import type { Client } from '@/db/types'
import { matchesClient } from '@/domain/clients'
import { ClientForm } from '@/features/clients/ClientForm'
import { cn } from '@/ui/cn'
import { Avatar } from '@/ui/Data'
import { Overlay } from '@/ui/Overlay'
import { useToast } from '@/ui/toastContext'
import { useEditor } from './useEditor'

/**
 * "Who is this invoice for?" Search saved clients, or type a new name and
 * save it as a client in one tap ("just type a name on an invoice — we'll
 * offer to save it"). "Add with details" swaps the list for the full client
 * form in the same sheet, so no dialog stacks on top of another.
 */
export function ClientPicker({
  open,
  onOpenChange,
  selectedId,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId: string | null
  onPick: (client: Client) => void
}) {
  const clients = useClients()
  const settings = useSettings()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [detailed, setDetailed] = useState(false)
  const matches = (clients ?? []).filter((c) => matchesClient(c, query))
  const name = query.trim()
  const exact = clients?.some((c) => c.name.toLowerCase() === name.toLowerCase())

  function pick(client: Client) {
    onPick(client)
    onOpenChange(false)
    setQuery('')
    setDetailed(false)
  }

  async function addNew() {
    const client = await createClient({ name })
    toast({ message: `${client.name} saved as a client` })
    pick(client)
  }

  return (
    <Overlay
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (o) return
        setQuery('')
        setDetailed(false)
      }}
      title={detailed ? 'New client' : 'Who is this invoice for?'}
      description={detailed ? 'Saved to this browser' : 'Pick a saved client or add a new one.'}
    >
      {detailed && settings ? (
        <ClientForm
          initialName={name}
          defaultCurrency={settings.currency}
          defaultTerms={settings.terms}
          onDone={(saved) => (saved ? pick(saved) : setDetailed(false))}
        />
      ) : (
        <>
          <label className="flex items-center gap-2 rounded-full bg-tile-tile px-3.5 py-2.5 focus-within:outline-2 focus-within:outline-tile-accent">
            <Search size={16} className="shrink-0 text-tile-muted" aria-hidden />
            <input
              type="search"
              aria-label="Search or type a new client"
              placeholder="Search or type a new client"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (matches[0]) pick(matches[0])
                else if (name) void addNew()
              }}
              className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-tile-subtle"
            />
          </label>
          <ul className="-mx-2 flex max-h-[320px] flex-col overflow-y-auto pb-[max(20px,env(safe-area-inset-bottom))] desk:pb-0">
            {name && !exact && (
              <li>
                <button type="button" onClick={addNew} className={rowClass}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tile-accent-soft text-tile-accent">
                    <UserPlus size={17} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold">Add “{name}”</span>
                    <span className="text-[13px] text-tile-muted">Save as a new client</span>
                  </span>
                </button>
              </li>
            )}
            <li>
              <button type="button" onClick={() => setDetailed(true)} className={rowClass}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tile-tile text-tile-muted">
                  <ContactRound size={17} aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-bold">Add with details</span>
                  <span className="text-[13px] text-tile-muted">
                    Email, address, tax ID, currency and terms
                  </span>
                </span>
              </button>
            </li>
            {matches.map((client) => (
              <li key={client.id}>
                <button type="button" onClick={() => pick(client)} className={rowClass}>
                  <Avatar name={client.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold">{client.name}</span>
                    <span className="truncate text-[13px] text-tile-muted">
                      {client.email || client.contact || 'No email'}
                    </span>
                  </span>
                  {client.id === selectedId && (
                    <Check size={16} className="shrink-0 text-tile-accent" aria-label="Selected" />
                  )}
                </button>
              </li>
            ))}
            {clients && clients.length === 0 && !name && (
              <li className="px-2 py-6 text-center text-sm text-tile-muted">
                No saved clients yet — type a name to add one.
              </li>
            )}
          </ul>
        </>
      )}
    </Overlay>
  )
}

const rowClass = cn(
  'flex w-full items-center gap-3 rounded-tile-md px-2 py-2 text-left hover:bg-tile-tile',
  'outline-none focus-visible:bg-tile-tile focus-visible:outline-2 focus-visible:outline-tile-accent',
)

/**
 * Edits the invoice's saved client, so later invoices for them get the
 * change too. A sent invoice prints its frozen copy, so that's updated as
 * well; other sent invoices keep theirs.
 */
export function EditClientOverlay({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { invoice, client, settings, set } = useEditor()
  if (!client) return null
  return (
    <Overlay
      open={open}
      onOpenChange={onOpenChange}
      title="Edit client"
      description="Changes are saved to this client"
    >
      <ClientForm
        key={String(open)}
        client={client}
        manage={false}
        defaultCurrency={settings.currency}
        defaultTerms={settings.terms}
        onDone={(saved) => {
          if (saved && invoice.clientSnapshot) {
            const { name, contact, email, address, taxId } = saved
            set({ clientSnapshot: { name, contact, email, address, taxId } })
          }
          onOpenChange(false)
        }}
      />
    </Overlay>
  )
}
