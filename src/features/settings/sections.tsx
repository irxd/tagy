import {
  Building2,
  Download,
  FileCog,
  Globe,
  HardDrive,
  Hash,
  Landmark,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useBlobUrl, useRecordCounts } from '@/db/hooks'
import { useBackup } from '@/features/backup/useBackup'
import { clearAllData, removeLogo, saveLogo } from '@/db/maintenance'
import type { PaymentTerms, TemplateId } from '@/db/types'
import { timeAgo } from '@/domain/dates'
import { formatInvoiceNumber } from '@/domain/numbering'
import { ImageError, resizeLogo } from '@/lib/image'
import { Button, IconButton } from '@/ui/Button'
import { Stat } from '@/ui/Data'
import { SelectField, TextAreaField, TextField } from '@/ui/Field'
import { initials } from '@/ui/initials'
import { ConfirmDialog } from '@/ui/Overlay'
import { FieldRow, SectionCard } from '@/ui/SectionCard'
import { useToast } from '@/ui/toastContext'
import { Toggle } from '@/ui/Toggle'
import {
  currencyOptions,
  dateFormatOptions,
  languageOptions,
  numberLocaleOptions,
  templateOptions,
  termOptions,
} from './options'
import type { SettingsDraft } from './useSettingsDraft'

type SectionProps = {
  form: SettingsDraft
  className?: string
  /** Mobile sub-pages already show the section title in their header. */
  hideHeader?: boolean
}

/** The single default tax rate Settings edits (taxRates[0]). */
export const DEFAULT_TAX_ID = 'default'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function BusinessSection({ form, className, hideHeader }: SectionProps) {
  const { draft, setBusiness } = form
  if (!draft) return null
  const b = draft.business
  const emailError = b.email && !EMAIL.test(b.email) ? 'Check this email address' : undefined

  return (
    <SectionCard
      icon={Building2}
      title="Business profile"
      description="Printed at the top of every invoice"
      className={className}
      hideHeader={hideHeader}
    >
      <LogoTile name={b.name} logoBlobId={b.logoBlobId} />
      <TextField
        label="Business name"
        placeholder="e.g. Irsya Studio"
        autoComplete="organization"
        value={b.name}
        onChange={(e) => setBusiness({ name: e.target.value })}
      />
      <FieldRow>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="hello@studio.com"
          value={b.email}
          error={emailError}
          onChange={(e) => setBusiness({ email: e.target.value })}
        />
        <TextField
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="Optional"
          value={b.phone}
          onChange={(e) => setBusiness({ phone: e.target.value })}
        />
      </FieldRow>
      <TextAreaField
        label="Address"
        rows={2}
        autoComplete="street-address"
        placeholder="Street, city, postcode, country"
        value={b.address}
        onChange={(e) => setBusiness({ address: e.target.value })}
      />
      <FieldRow>
        <TextField
          label="Tax ID"
          placeholder="Optional"
          value={b.taxId}
          onChange={(e) => setBusiness({ taxId: e.target.value })}
        />
        <TextField
          label="Website"
          type="url"
          inputMode="url"
          placeholder="Optional"
          value={b.website}
          onChange={(e) => setBusiness({ website: e.target.value })}
        />
      </FieldRow>
    </SectionCard>
  )
}

function LogoTile({ name, logoBlobId }: { name: string; logoBlobId: string | null }) {
  const url = useBlobUrl(logoBlobId)
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      await saveLogo(await resizeLogo(file))
    } catch (e) {
      setError(e instanceof ImageError ? e.message : 'Could not save that image.')
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 rounded-tile-md bg-tile-tile p-2.5">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-tile-fg text-base font-bold text-white">
          {url ? (
            <img src={url} alt="Your logo" className="size-full bg-white object-contain" />
          ) : (
            <span aria-hidden>{name ? initials(name) : '?'}</span>
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-[15px] font-bold">Logo</span>
          <span className="text-[13px] text-tile-muted">PNG, JPG or SVG, square works best</span>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button variant="outline" icon={Upload} onClick={() => input.current?.click()}>
          {url ? 'Replace' : 'Upload'}
        </Button>
        {url && <IconButton icon={X} label="Remove logo" onClick={() => removeLogo()} />}
      </div>
      {error && <p className="px-1 text-xs font-medium text-tile-danger">{error}</p>}
    </div>
  )
}

export function PaymentSection({ form, className, hideHeader }: SectionProps) {
  const { draft, set, setBusiness } = form
  if (!draft) return null
  return (
    <SectionCard
      icon={Landmark}
      title="Payment details"
      description="Text shown on invoices so clients know how to pay you"
      className={className}
      hideHeader={hideHeader}
    >
      <TextAreaField
        label="Instructions"
        rows={4}
        placeholder={
          'Bank transfer · Bank name\nAccount number · Routing\nPlease use the invoice number as reference.'
        }
        value={draft.business.paymentDetails}
        onChange={(e) => setBusiness({ paymentDetails: e.target.value })}
      />
      <Toggle
        checked={draft.paymentDetailsByDefault}
        onCheckedChange={(v) => set({ paymentDetailsByDefault: v })}
      >
        Add to new invoices by default
      </Toggle>
    </SectionCard>
  )
}

export function DefaultsSection({ form, className, hideHeader }: SectionProps) {
  const { draft, set } = form
  const [nextText, setNextText] = useState<string | null>(null)
  if (!draft) return null

  const taxPct = draft.taxRates.find((t) => t.id === DEFAULT_TAX_ID)?.pct
  const nextValue = nextText ?? String(draft.nextNumber).padStart(4, '0')
  const nextValid = /^\d{1,9}$/.test(nextValue) && Number(nextValue) >= 1

  function setTax(text: string) {
    const pct = Number(text.replace(',', '.'))
    if (text.trim() === '' || !Number.isFinite(pct) || pct <= 0) {
      set({
        taxRates: draft!.taxRates.filter((t) => t.id !== DEFAULT_TAX_ID),
        defaultTaxRateId: null,
      })
    } else {
      set({
        taxRates: [{ id: DEFAULT_TAX_ID, name: 'Tax', pct }],
        defaultTaxRateId: DEFAULT_TAX_ID,
      })
    }
  }

  return (
    <SectionCard
      icon={FileCog}
      title="Invoice defaults"
      description="Every new invoice starts with these"
      className={className}
      hideHeader={hideHeader}
    >
      <FieldRow>
        <TextField
          label="Number prefix"
          maxLength={12}
          value={draft.prefix}
          onChange={(e) => set({ prefix: e.target.value })}
        />
        <TextField
          label="Next number"
          inputMode="numeric"
          value={nextValue}
          error={nextValid ? undefined : 'Use a whole number from 1'}
          onChange={(e) => {
            setNextText(e.target.value)
            if (/^\d{1,9}$/.test(e.target.value) && Number(e.target.value) >= 1) {
              set({ nextNumber: Number(e.target.value) })
            }
          }}
          onBlur={() => nextValid && setNextText(null)}
        />
      </FieldRow>
      <p className="flex items-center gap-2 rounded-tile-md border border-tile-border px-3.5 py-2.5 text-sm text-tile-muted">
        <Hash size={15} aria-hidden />
        Next invoice will be
        <span className="rounded-full bg-tile-accent-soft px-[7px] py-[3px] text-[13px] font-bold text-tile-accent-ink">
          {formatInvoiceNumber(draft.prefix, draft.nextNumber)}
        </span>
      </p>
      <FieldRow>
        <SelectField
          label="Currency"
          options={currencyOptions}
          value={draft.currency}
          onChange={(e) => set({ currency: e.target.value })}
        />
        <SelectField
          label="Payment terms"
          options={termOptions}
          value={draft.terms}
          onChange={(e) => set({ terms: e.target.value as PaymentTerms })}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label="Tax rate (%)"
          inputMode="decimal"
          placeholder="None"
          defaultValue={taxPct ?? ''}
          onChange={(e) => setTax(e.target.value)}
        />
        <SelectField
          label="Template"
          options={templateOptions}
          value={draft.defaultTemplate}
          onChange={(e) => set({ defaultTemplate: e.target.value as TemplateId })}
        />
      </FieldRow>
      <TextAreaField
        label="Default notes"
        rows={2}
        value={draft.defaultNotes}
        onChange={(e) => set({ defaultNotes: e.target.value })}
      />
    </SectionCard>
  )
}

export function FormatSection({ form, className, hideHeader }: SectionProps) {
  const { draft, set } = form
  if (!draft) return null
  return (
    <SectionCard
      icon={Globe}
      title="Region & format"
      description="How dates and numbers appear"
      className={className}
      hideHeader={hideHeader}
    >
      <FieldRow cols={3}>
        <SelectField label="Language" options={languageOptions} value="en" onChange={() => {}} />
        <SelectField
          label="Date"
          options={dateFormatOptions()}
          value={draft.dateFormat}
          onChange={(e) => set({ dateFormat: e.target.value })}
        />
        <SelectField
          label="Numbers"
          options={numberLocaleOptions}
          value={draft.locale}
          onChange={(e) => set({ locale: e.target.value })}
        />
      </FieldRow>
    </SectionCard>
  )
}

export function DataSection({
  lastBackupAt,
  onCleared,
  className,
}: {
  lastBackupAt: string | null
  onCleared: () => void
  className?: string
}) {
  const counts = useRecordCounts()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const backup = useBackup()

  return (
    <SectionCard
      icon={HardDrive}
      title="Data & backup"
      description="Your data never leaves this browser"
      className={className}
    >
      <FieldRow cols={3}>
        <Stat label="Invoices" value={counts?.invoices ?? '—'} />
        <Stat label="Clients" value={counts?.clients ?? '—'} />
        <Stat label="Last backup" value={lastBackupAt ? timeAgo(lastBackupAt) : 'Never'} />
      </FieldRow>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="dark"
          icon={Download}
          disabled={backup.busy}
          onClick={() => void backup.exportNow()}
        >
          Export backup
        </Button>
        <Button variant="outline" icon={Upload} onClick={backup.pickImport}>
          Import
        </Button>
        <Button
          variant="danger-soft"
          icon={Trash2}
          className="sm:ml-auto"
          onClick={() => setConfirmOpen(true)}
        >
          Clear all data
        </Button>
      </div>
      <ClearAllDialog open={confirmOpen} onOpenChange={setConfirmOpen} onCleared={onCleared} />
      {backup.element}
    </SectionCard>
  )
}

const CONFIRM_WORD = 'clear'

export function ClearAllDialog({
  open,
  onOpenChange,
  onCleared,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCleared: () => void
}) {
  const toast = useToast()
  const [typed, setTyped] = useState('')
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setTyped('')
      }}
      icon={Trash2}
      tone="danger"
      title="Clear all data?"
      description="This deletes every invoice, client and setting from this browser. There's no account to restore them from."
      confirmLabel="Clear all data"
      confirmIcon={Trash2}
      confirmDisabled={typed.trim().toLowerCase() !== CONFIRM_WORD}
      onConfirm={async () => {
        await clearAllData()
        onCleared()
        toast({ message: 'All data cleared from this browser' })
      }}
    >
      <TextField
        label={`Type “${CONFIRM_WORD}” to confirm`}
        autoComplete="off"
        autoCapitalize="none"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
      />
    </ConfirmDialog>
  )
}
