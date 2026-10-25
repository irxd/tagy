import { Check, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { SaveIndicator } from '@/app/SaveIndicator'
import { trackSave } from '@/app/saveStatus'
import { defaultSettings } from '@/db/defaults'
import { useBlobUrl, useClient, useInvoices, useSettings } from '@/db/hooks'
import { updateSettings, type SettingsPatch } from '@/db/settings'
import type {
  Accent,
  AppSettings,
  NamedFont,
  Paper,
  ShowFields,
  TemplateFont,
  TemplateId,
} from '@/db/types'
import { todayISO } from '@/domain/dates'
import { TEMPLATE_LABELS } from '@/features/settings/options'
import { FONT_LABELS, FONTS, TEMPLATE_FONTS, type FontRole } from '@/templates/fonts'
import { InvoiceDocument } from '@/templates/InvoiceDocument'
import { sampleInvoice } from '@/templates/sample'
import { ACCENTS, buildInvoiceView, PAGE_WIDTH, type InvoiceView } from '@/templates/view'
import { Button } from '@/ui/Button'
import { cn } from '@/ui/cn'
import { PageHeader } from '@/ui/PageHeader'
import { useToast } from '@/ui/toastContext'
import { Toggle } from '@/ui/Toggle'
import { useLayout } from '@/ui/useLayout'

const TEMPLATE_IDS = Object.keys(TEMPLATE_LABELS) as TemplateId[]
const DESCRIPTIONS: Record<TemplateId, string> = {
  minimal: 'Big sender masthead, hairline grid',
  classic: 'Serif letterhead, double rules',
  bold: 'Accent band leads with the total',
  studio: 'Details in a side rail',
}
const SHOW: { key: keyof ShowFields; label: string }[] = [
  { key: 'logo', label: 'Business logo' },
  { key: 'taxId', label: 'Tax ID' },
  { key: 'paymentDetails', label: 'Payment details' },
  { key: 'signature', label: 'Signature line' },
]

/**
 * Templates: pick a look (previewed live), customise accent, font, paper and
 * what shows. Customisation saves right away; the picked template becomes
 * the default for new invoices with "Set as default".
 */
export function TemplatesPage() {
  const settings = useSettings()
  if (!settings) return null
  return <Templates settings={settings} />
}

function Templates({ settings }: { settings: AppSettings }) {
  const layout = useLayout()
  const toast = useToast()
  const [picked, setPicked] = useState<TemplateId>(settings.defaultTemplate)
  const view = usePreviewView(settings)
  const isDefault = picked === settings.defaultTemplate
  const save = (patch: SettingsPatch) => void trackSave(updateSettings(patch))

  async function setDefault() {
    await trackSave(updateSettings({ defaultTemplate: picked }))
    toast({ message: `${TEMPLATE_LABELS[picked]} is now the default for new invoices` })
  }

  function reset() {
    const d = defaultSettings()
    save({ accent: d.accent, fonts: d.fonts, paper: d.paper, showFields: d.showFields })
    setPicked(settings.defaultTemplate)
  }

  const defaultButton = (
    <Button
      variant="dark"
      size={layout === 'mobile' ? 'lg' : 'md'}
      icon={Check}
      disabled={isDefault}
      onClick={setDefault}
    >
      {isDefault
        ? `${TEMPLATE_LABELS[picked]} is the default`
        : `Set ${TEMPLATE_LABELS[picked]} as default`}
    </Button>
  )

  const chooser = (
    <TemplateChooser
      picked={picked}
      onPick={setPicked}
      view={view}
      defaultId={settings.defaultTemplate}
    />
  )
  const customizer = <Customizer settings={settings} picked={picked} save={save} />
  const preview = <Preview view={view} template={picked} />

  if (layout === 'mobile') {
    return (
      <div className="flex flex-col gap-[18px]">
        <PageHeader eyebrow="Your data stays the same" title="Templates" />
        {preview}
        {chooser}
        {customizer}
        <div className="flex flex-col gap-2">
          {defaultButton}
          <Button variant="soft" size="lg" icon={RotateCcw} onClick={reset}>
            Reset look
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Templates"
        subtitle="Pick a look for your invoices. Your data stays exactly the same."
        actions={
          <>
            <SaveIndicator />
            <Button icon={RotateCcw} onClick={reset}>
              Reset
            </Button>
            {defaultButton}
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,360px)_minmax(0,384px)_minmax(0,1fr)] items-start gap-6">
        <section aria-label="Choose" className="flex flex-col gap-3.5">
          <h2 className="text-lg font-bold">Choose</h2>
          {chooser}
        </section>
        <section aria-label="Customize" className="flex flex-col gap-3.5">
          <h2 className="text-lg font-bold">Customize</h2>
          {customizer}
        </section>
        {preview}
      </div>
    </div>
  )
}

/** The most recently edited invoice, or the sample before any exist. */
function usePreviewView(settings: AppSettings): InvoiceView {
  const invoices = useInvoices()
  const latest = invoices?.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const client = useClient(latest?.clientId ?? undefined)
  const logoUrl = useBlobUrl(settings.business.logoBlobId)
  const source = latest ? { invoice: latest, client } : sampleInvoice(settings)
  return buildInvoiceView({ ...source, settings, logoUrl, today: todayISO() })
}

function TemplateChooser({
  picked,
  onPick,
  view,
  defaultId,
}: {
  picked: TemplateId
  onPick: (t: TemplateId) => void
  view: InvoiceView
  defaultId: TemplateId
}) {
  const mobile = useLayout() === 'mobile'
  return (
    <div
      role="radiogroup"
      aria-label="Template"
      className={cn(mobile ? '-mx-4 flex gap-2 overflow-x-auto px-4' : 'flex flex-col gap-2')}
    >
      {TEMPLATE_IDS.map((t) => {
        const selected = picked === t
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={TEMPLATE_LABELS[t]}
            onClick={() => onPick(t)}
            className={cn(
              'flex shrink-0 items-center gap-3.5 rounded-tile-lg border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-tile-accent',
              mobile && 'flex-col gap-2 p-2',
              selected
                ? 'border-tile-accent bg-tile-panel'
                : 'border-transparent bg-tile-tile hover:bg-tile-tile-strong',
            )}
          >
            <Thumb view={view} template={t} />
            <span className={cn('flex min-w-0 flex-1 flex-col gap-1', mobile && 'items-center')}>
              <span className={cn('font-bold', mobile ? 'text-[13px]' : 'text-base')}>
                {TEMPLATE_LABELS[t]}
              </span>
              {!mobile && <span className="text-[13px] text-tile-muted">{DESCRIPTIONS[t]}</span>}
              {!mobile && t === defaultId && (
                <span className="w-fit rounded-full bg-tile-tile-strong px-2 py-0.5 text-[11px] font-semibold text-tile-fg">
                  Default
                </span>
              )}
            </span>
            {selected && !mobile && (
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-tile-accent text-white">
                <Check size={14} aria-hidden />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** The real template, tiny: the top of the page inside an 84 px tile. */
function Thumb({ view, template }: { view: InvoiceView; template: TemplateId }) {
  return (
    <span
      aria-hidden
      className="flex size-[84px] shrink-0 justify-center overflow-hidden rounded-[10px] bg-tile-tile-strong px-[9px] pt-2.5"
    >
      <span
        className="pointer-events-none block overflow-hidden rounded-[3px] bg-white shadow-sm"
        style={{ zoom: 66 / PAGE_WIDTH }}
      >
        <InvoiceDocument template={template} view={view} />
      </span>
    </span>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5 rounded-tile-lg bg-tile-tile p-3.5">
      <legend className="float-left mb-2.5 text-[13px] text-tile-muted">{title}</legend>
      {children}
    </fieldset>
  )
}

function Customizer({
  settings,
  picked,
  save,
}: {
  settings: AppSettings
  picked: TemplateId
  save: (patch: SettingsPatch) => void
}) {
  const [role, setRole] = useState<FontRole>('heading')
  const own = TEMPLATE_FONTS[picked][role]
  const current = settings.fonts[role]
  const pickFont = (font: TemplateFont) => save({ fonts: { ...settings.fonts, [role]: font } })
  return (
    <div className="flex flex-col gap-2.5">
      <Group title="Accent color">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent colour">
          {(Object.keys(ACCENTS) as Accent[]).map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={settings.accent === a}
              aria-label={a}
              onClick={() => save({ accent: a })}
              className={cn(
                'grid size-8 place-items-center rounded-full border-[1.5px] bg-tile-panel focus-visible:outline-2 focus-visible:outline-tile-accent',
                settings.accent === a ? 'border-tile-fg' : 'border-transparent',
              )}
            >
              <span className="size-[22px] rounded-full" style={{ background: ACCENTS[a] }} />
            </button>
          ))}
        </div>
      </Group>
      <Group title="Font">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Font for">
          {(['heading', 'body'] as FontRole[]).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => setRole(r)}
              className={cn(
                'rounded-full py-2 pr-3 pl-3.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-tile-accent',
                role === r ? 'bg-tile-fg text-white' : 'bg-tile-panel text-tile-fg',
              )}
            >
              {r === 'heading' ? 'Heading' : 'Body'}
            </button>
          ))}
        </div>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label={role === 'heading' ? 'Heading font' : 'Body font'}
        >
          <FontOption
            id="template"
            label="Template"
            detail={FONT_LABELS[own]}
            family={FONTS[own]}
            selected={current === 'template'}
            onPick={pickFont}
          />
          {(Object.keys(FONT_LABELS) as NamedFont[]).map((f) => (
            <FontOption
              key={f}
              id={f}
              label={FONT_LABELS[f]}
              family={FONTS[f]}
              selected={current === f}
              onPick={pickFont}
            />
          ))}
        </div>
      </Group>
      <Group title="Paper size">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Paper size">
          {(['a4', 'letter'] as Paper[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={settings.paper === p}
              onClick={() => save({ paper: p })}
              className={cn(
                'rounded-full py-2 pr-3 pl-3.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-tile-accent',
                settings.paper === p ? 'bg-tile-fg text-white' : 'bg-tile-panel text-tile-fg',
              )}
            >
              {p === 'a4' ? 'A4' : 'US Letter'}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Show on invoice">
        <div className="flex flex-col gap-3 pt-1 pb-0.5">
          {SHOW.map(({ key, label }) => (
            <Toggle
              key={key}
              checked={settings.showFields[key]}
              onCheckedChange={(v) => save({ showFields: { ...settings.showFields, [key]: v } })}
            >
              {label}
            </Toggle>
          ))}
        </div>
      </Group>
    </div>
  )
}

function Preview({ view, template }: { view: InvoiceView; template: TemplateId }) {
  const mobile = useLayout() === 'mobile'
  const width = mobile ? 326 : 416
  return (
    <section
      aria-label="Preview"
      className="relative flex justify-center overflow-hidden rounded-tile-lg bg-linear-to-b from-[#e9ecf1] to-[#dce1e8] px-4 pt-12 pb-4 desk:sticky desk:top-5"
    >
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-semibold">
        <span className="size-[7px] rounded-full bg-tile-success" aria-hidden />
        Preview · {view.number}
      </span>
      <div
        className={cn(
          'overflow-hidden rounded-[4px] bg-white shadow-[0_8px_24px_#1a1f2b14]',
          mobile && 'max-h-[360px]',
        )}
        style={{ zoom: width / PAGE_WIDTH }}
      >
        <InvoiceDocument template={template} view={view} />
      </div>
    </section>
  )
}

/** One Font choice: "Aa" in the font over its name. Template spans the row. */
function FontOption({
  id,
  label,
  detail,
  family,
  selected,
  onPick,
}: {
  id: TemplateFont
  label: string
  detail?: string
  family: string
  selected: boolean
  onPick: (font: TemplateFont) => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={() => onPick(id)}
      className={cn(
        'flex items-center gap-0.5 rounded-tile-md border bg-tile-panel px-2 py-2.5 focus-visible:outline-2 focus-visible:outline-tile-accent',
        detail ? 'col-span-3 justify-center gap-3' : 'flex-col',
        selected ? 'border-tile-accent' : 'border-transparent',
      )}
    >
      <span className="text-[22px] leading-tight" style={{ fontFamily: family }} aria-hidden>
        Aa
      </span>
      <span
        className={cn(
          'text-xs whitespace-nowrap',
          selected ? 'font-bold text-tile-fg' : 'text-tile-muted',
        )}
      >
        {label}
        {detail && <span className="font-normal text-tile-muted"> · {detail}</span>}
      </span>
    </button>
  )
}
