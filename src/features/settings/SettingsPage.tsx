import {
  CalendarDays,
  CircleDollarSign,
  Download,
  Globe,
  Hash,
  Info,
  Landmark,
  LayoutTemplate,
  Trash2,
  Upload,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { SaveIndicator } from '@/app/SaveIndicator'
import { useBackup } from '@/features/backup/useBackup'
import { useBlobUrl } from '@/db/hooks'
import { TERM_LABELS, timeAgo } from '@/domain/dates'
import { formatInvoiceNumber } from '@/domain/numbering'
import { Button } from '@/ui/Button'
import { initials } from '@/ui/initials'
import { ListButton, ListGroup, ListLink, ListRow, ListSelect, SubPageHeader } from '@/ui/ListGroup'
import { PageHeader } from '@/ui/PageHeader'
import { useLayout } from '@/ui/useLayout'
import { currencyOptions, dateFormatOptions, languageOptions, TEMPLATE_LABELS } from './options'
import {
  BusinessSection,
  ClearAllDialog,
  DataSection,
  DefaultsSection,
  FormatSection,
  PaymentSection,
} from './sections'
import { useSettingsDraft, type SettingsDraft } from './useSettingsDraft'

const SUBTITLE = 'Your business details and defaults — stored only in this browser'

export function SettingsPage() {
  // Bumped by Clear all data so every section reloads from the empty store.
  const [generation, setGeneration] = useState(0)
  const reset = () => setGeneration((g) => g + 1)
  return useLayout() === 'desktop' ? (
    <DesktopSettings key={generation} onCleared={reset} />
  ) : (
    <MobileSettings key={generation} onCleared={reset} />
  )
}

/** Desktop · Settings — two-column bento of section cards. */
function DesktopSettings({ onCleared }: { onCleared: () => void }) {
  const form = useSettingsDraft()
  // Render header and cards together once settings load, so nothing jumps.
  if (!form.draft) return null
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" subtitle={SUBTITLE} actions={<SaveIndicator />} />
      <div className="grid grid-cols-2 items-start gap-4">
        <div className="flex flex-col gap-4">
          <BusinessSection form={form} />
          <PaymentSection form={form} />
        </div>
        <div className="flex flex-col gap-4">
          <DefaultsSection form={form} />
          <FormatSection form={form} />
          <DataSection lastBackupAt={form.draft?.lastBackupAt ?? null} onCleared={onCleared} />
        </div>
      </div>
    </div>
  )
}

/** Mobile · Settings — grouped list; profile, defaults and payment open sub-pages. */
function MobileSettings({ onCleared }: { onCleared: () => void }) {
  const form = useSettingsDraft()
  const { draft, set } = form
  const logoUrl = useBlobUrl(draft?.business.logoBlobId)
  const [clearOpen, setClearOpen] = useState(false)
  const backup = useBackup()
  if (!draft) return null

  const b = draft.business
  const tax = draft.taxRates.find((t) => t.id === draft.defaultTaxRateId)
  const defaultsSummary = [
    `Next: ${formatInvoiceNumber(draft.prefix, draft.nextNumber)}`,
    TERM_LABELS[draft.terms],
    tax ? `${tax.pct}% tax` : 'No tax',
  ].join(' · ')

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader eyebrow="Stored only in this browser" title="Settings" />

      <Link
        to="/settings/business"
        className="flex items-center gap-3.5 rounded-[20px] border border-tile-border bg-tile-panel p-4 focus-visible:outline-2 focus-visible:outline-tile-accent"
      >
        <span className="grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-[14px] bg-tile-fg text-[17px] font-bold text-white">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="size-full bg-white object-contain" />
          ) : (
            <span aria-hidden>{b.name ? initials(b.name) : '?'}</span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-lg font-bold">{b.name || 'Add your business'}</span>
          <span className="text-[13px] text-tile-muted">Logo, address, tax ID</span>
        </span>
      </Link>

      <ListGroup title="Invoicing">
        <ListLink
          to="/settings/defaults"
          icon={Hash}
          title="Invoice defaults"
          subtitle={defaultsSummary}
        />
        <ListLink
          to="/settings/payment"
          icon={Landmark}
          title="Payment details"
          subtitle={b.paymentDetails.split('\n')[0] || 'How clients pay you'}
        />
        <ListLink
          to="/templates"
          icon={LayoutTemplate}
          title="Default template"
          value={TEMPLATE_LABELS[draft.defaultTemplate]}
        />
      </ListGroup>

      <ListGroup title="Format">
        <ListSelect
          icon={Globe}
          title="Language"
          options={languageOptions}
          value="en"
          onChange={() => {}}
        />
        <ListSelect
          icon={CalendarDays}
          title="Date format"
          options={dateFormatOptions()}
          value={draft.dateFormat}
          onChange={(e) => set({ dateFormat: e.target.value })}
        />
        <ListSelect
          icon={CircleDollarSign}
          title="Currency"
          options={currencyOptions.map((o) => ({ ...o, label: o.value }))}
          value={draft.currency}
          onChange={(e) => set({ currency: e.target.value })}
        />
      </ListGroup>

      <ListGroup title="Data & backup">
        <ListRow
          icon={Download}
          tone="accent"
          title="Export backup"
          subtitle={
            draft.lastBackupAt
              ? `Last backup ${timeAgo(draft.lastBackupAt).toLowerCase()}`
              : 'Never backed up'
          }
          trailing={
            <Button
              variant="dark"
              icon={Download}
              disabled={backup.busy}
              onClick={() => void backup.exportNow()}
              className="py-2 text-[13px]"
            >
              Export
            </Button>
          }
        />
        <ListButton icon={Upload} title="Import backup" onClick={backup.pickImport} />
        <ListButton
          icon={Trash2}
          tone="danger"
          title="Clear all data"
          subtitle="Removes everything from this browser"
          trailing={<span />}
          onClick={() => setClearOpen(true)}
        />
      </ListGroup>

      <ListGroup title="About">
        <ListRow icon={Info} title="Version" value={__APP_VERSION__} trailing={<span />} />
      </ListGroup>

      <ClearAllDialog open={clearOpen} onOpenChange={setClearOpen} onCleared={onCleared} />
      {backup.element}
    </div>
  )
}

const subPages: Record<
  string,
  { title: string; Section: (p: { form: SettingsDraft; hideHeader?: boolean }) => ReactNode }
> = {
  business: { title: 'Business profile', Section: BusinessSection },
  defaults: { title: 'Invoice defaults', Section: DefaultsSection },
  payment: { title: 'Payment details', Section: PaymentSection },
}

/** Mobile sub-page for one settings section; desktop shows everything on /settings. */
export function SettingsSubPage() {
  const { section = '' } = useParams()
  const layout = useLayout()
  const form = useSettingsDraft()
  const page = subPages[section]
  if (!page || layout === 'desktop') return <Navigate to="/settings" replace />
  const { title, Section } = page
  return (
    <div className="flex flex-col gap-4">
      <SubPageHeader title={title} backTo="/settings" />
      <Section form={form} hideHeader />
      <div className="flex justify-center">
        <SaveIndicator />
      </div>
    </div>
  )
}
