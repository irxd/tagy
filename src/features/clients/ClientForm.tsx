import { Archive, ArchiveRestore, Check, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { createClient, deleteClient, setClientArchived, updateClient } from '@/db/clients'
import type { Client, PaymentTerms } from '@/db/types'
import { TERM_LABELS } from '@/domain/dates'
import { currencyOptions, termOptions } from '@/features/settings/options'
import { Button, IconButton } from '@/ui/Button'
import { SelectField, TextAreaField, TextField } from '@/ui/Field'
import { useToast } from '@/ui/toastContext'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ClientFormProps {
  /** Omit to create a new client. */
  client?: Client
  /** Prefills the name of a new client, e.g. what was typed in the invoice's client search. */
  initialName?: string
  /** Invoices billed to this client; a client with invoices can be archived but not deleted. */
  invoiceCount?: number
  defaultCurrency: string
  defaultTerms: PaymentTerms
  onDone: (saved?: Client) => void
}

type Draft = Pick<Client, 'name' | 'contact' | 'email' | 'address' | 'taxId'> & {
  currency: string
  terms: string
}

/**
 * New / edit client form. Saves on submit (a deliberate action, unlike the
 * autosaving settings), since a half-typed client shouldn't appear in pickers.
 */
export function ClientForm({
  client,
  initialName = '',
  invoiceCount = 0,
  defaultCurrency,
  defaultTerms,
  onDone,
}: ClientFormProps) {
  const toast = useToast()
  const [draft, setDraft] = useState<Draft>({
    name: client?.name ?? initialName,
    contact: client?.contact ?? '',
    email: client?.email ?? '',
    address: client?.address ?? '',
    taxId: client?.taxId ?? '',
    currency: client?.currency ?? '',
    terms: client?.terms ?? '',
  })
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  const nameError = submitted && !draft.name.trim() ? 'Add a name for this client' : undefined
  const emailError =
    draft.email && !EMAIL.test(draft.email.trim()) ? 'Check this email address' : undefined

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!draft.name.trim() || emailError) return
    const values = {
      name: draft.name.trim(),
      contact: draft.contact.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
      taxId: draft.taxId.trim(),
      currency: draft.currency || null,
      terms: (draft.terms || null) as PaymentTerms | null,
    }
    if (client) {
      await updateClient(client.id, values)
      onDone({ ...client, ...values })
    } else {
      const created = await createClient(values)
      toast({ message: `${created.name} saved` })
      onDone(created)
    }
  }

  async function toggleArchive() {
    if (!client) return
    await setClientArchived(client.id, !client.archived)
    toast({
      message: `${client.name} ${client.archived ? 'restored' : 'archived'}`,
      action: {
        label: 'Undo',
        onClick: () => void setClientArchived(client.id, client.archived),
      },
    })
    onDone()
  }

  async function remove() {
    if (!client) return
    await deleteClient(client.id)
    toast({ message: `${client.name} deleted` })
    onDone()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
      <TextField
        label="Business name"
        placeholder="e.g. Fern & Fable Co."
        autoFocus={!client}
        autoComplete="off"
        value={draft.name}
        error={nameError}
        onChange={(e) => set({ name: e.target.value })}
      />
      <TextField
        label="Contact person"
        placeholder="e.g. Jamie Rivera"
        autoComplete="off"
        value={draft.contact}
        onChange={(e) => set({ contact: e.target.value })}
      />
      <TextField
        label="Email"
        type="email"
        placeholder="e.g. billing@company.com"
        autoComplete="off"
        value={draft.email}
        error={emailError}
        onChange={(e) => set({ email: e.target.value })}
      />
      <TextAreaField
        label="Billing address"
        rows={2}
        placeholder={'Street, city, postcode\nCountry'}
        value={draft.address}
        onChange={(e) => set({ address: e.target.value })}
      />
      {/* Side by side even on phones, as in the New client sheet. */}
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Tax ID"
          placeholder="Optional"
          value={draft.taxId}
          onChange={(e) => set({ taxId: e.target.value })}
        />
        <SelectField
          label="Currency"
          value={draft.currency}
          options={[{ value: '', label: `${defaultCurrency} (default)` }, ...currencyOptions]}
          onChange={(e) => set({ currency: e.target.value })}
        />
      </div>
      <SelectField
        label="Payment terms"
        value={draft.terms}
        options={[{ value: '', label: `${TERM_LABELS[defaultTerms]} (default)` }, ...termOptions]}
        onChange={(e) => set({ terms: e.target.value })}
      />

      {/* Pinned to the bottom of a scrolling sheet so Save stays reachable on short phones. */}
      <div className="sticky bottom-0 -mx-5 flex items-center gap-2 bg-tile-panel px-5 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] desk:static desk:mx-0 desk:px-0 desk:pb-0">
        {client &&
          (invoiceCount === 0 ? (
            <IconButton icon={Trash2} label={`Delete ${client.name}`} onClick={remove} />
          ) : (
            <IconButton
              icon={client.archived ? ArchiveRestore : Archive}
              label={client.archived ? 'Restore client' : 'Archive client'}
              onClick={toggleArchive}
            />
          ))}
        <Button variant="soft" className="ml-auto" onClick={() => onDone()}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" icon={Check}>
          {client ? 'Save changes' : 'Save client'}
        </Button>
      </div>
    </form>
  )
}
