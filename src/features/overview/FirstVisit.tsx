import {
  ArrowRight,
  CircleCheck,
  Eye,
  FilePlus2,
  FileCheck,
  FileClock,
  FileText,
  HardDrive,
  Plus,
  Sparkles,
  Upload,
  WandSparkles,
} from 'lucide-react'
import { Link } from 'react-router'
import { useSettings } from '@/db/hooks'
import { useBackup } from '@/features/backup/useBackup'
import { addSampleData } from '@/db/sample'
import { todayISO } from '@/domain/dates'
import { TEMPLATE_LABELS } from '@/features/settings/options'
import { InvoiceDocument } from '@/templates/InvoiceDocument'
import { sampleInvoice } from '@/templates/sample'
import { buildInvoiceView, PAGE_WIDTH } from '@/templates/view'
import { Button } from '@/ui/Button'
import { cn } from '@/ui/cn'
import { PageHeader } from '@/ui/PageHeader'
import { useToast } from '@/ui/toastContext'
import { useLayout } from '@/ui/useLayout'

/** Overview — First visit: a welcome hero, setup checklist, empty list and import hint. */
export function FirstVisit() {
  const settings = useSettings()
  const mobile = useLayout() === 'mobile'
  const toast = useToast()
  const backup = useBackup()
  if (!settings) return null

  const steps = [
    {
      title: 'Business details',
      sub: 'Name, logo, address',
      to: mobile ? '/settings/business' : '/settings',
      done: !!settings.business.name,
    },
    {
      title: 'Payment details',
      sub: 'How clients pay you',
      to: mobile ? '/settings/payment' : '/settings',
      done: !!settings.business.paymentDetails,
    },
    {
      title: 'Template',
      sub: `${TEMPLATE_LABELS[settings.defaultTemplate]} · ready`,
      to: '/templates',
      done: true,
    },
  ]

  async function explore() {
    await addSampleData(todayISO(), settings!.currency)
    toast({ message: 'Sample data added — remove it anytime from Overview' })
  }

  const createLink =
    'inline-flex items-center justify-center gap-[7px] rounded-full bg-tile-accent font-semibold text-white hover:bg-tile-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tile-accent'

  const hero = (
    <div className="flex flex-col gap-4">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-tile-accent-soft py-1.5 pr-3 pl-2.5 text-[13px] font-semibold text-tile-accent-ink">
        <Sparkles size={14} className="text-tile-accent" aria-hidden />
        Free · no sign-up
      </span>
      <h2 className="text-[28px] leading-[1.15] font-bold tracking-[-0.8px] desk:text-[32px]">
        Create your first invoice in about 2 minutes
      </h2>
      <p className="max-w-[520px] text-[15px] text-tile-muted">
        Fill in the details, pick a look, download a PDF. Everything stays in this browser — nothing
        is uploaded.
      </p>
      <div className={cn('flex gap-2 pt-1.5', mobile && 'flex-col')}>
        <Link
          to="/invoices/new"
          className={cn(
            createLink,
            mobile ? 'py-[15px] text-base' : 'py-[9px] pr-4 pl-[13px] text-sm',
          )}
        >
          <FilePlus2 size={mobile ? 17 : 15} aria-hidden />
          Create first invoice
        </Link>
        <Button size={mobile ? 'lg' : 'md'} icon={WandSparkles} onClick={explore}>
          Explore with sample data
        </Button>
      </div>
    </div>
  )

  const setup = mobile ? (
    <ol className="flex flex-col rounded-[18px] border border-tile-border bg-tile-panel px-3.5 py-0.5">
      {steps.map((s, i) => (
        <li key={s.title} className="border-b border-tile-border last:border-b-0">
          <Link to={s.to} className="flex items-center gap-3 py-3">
            <StepNumber n={i + 1} done={s.done} onPanel />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-semibold">{s.title}</span>
              <span className="text-xs text-tile-muted">{s.sub}</span>
            </span>
            {s.done ? (
              <CircleCheck size={16} className="text-tile-success-ink" aria-label="Done" />
            ) : (
              <ArrowRight size={16} className="text-tile-subtle" aria-hidden />
            )}
          </Link>
        </li>
      ))}
    </ol>
  ) : (
    <ol className="grid grid-cols-3 gap-2.5">
      {steps.map((s, i) => (
        <li key={s.title}>
          <Link
            to={s.to}
            className="flex flex-col gap-2.5 rounded-tile-md bg-tile-tile p-3 hover:bg-tile-tile-strong focus-visible:outline-2 focus-visible:outline-tile-accent"
          >
            <span className="flex items-center justify-between">
              <StepNumber n={i + 1} done={s.done} />
              {s.done ? (
                <CircleCheck size={15} className="text-tile-success-ink" aria-label="Done" />
              ) : (
                <ArrowRight size={15} className="text-tile-muted" aria-hidden />
              )}
            </span>
            <span className="flex flex-col gap-px">
              <span className="text-sm font-bold">{s.title}</span>
              <span className="text-xs text-tile-muted">{s.sub}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )

  const view = buildInvoiceView({
    ...sampleInvoice(settings),
    settings,
    logoUrl: null,
    today: todayISO(),
  })

  const emptyList = (
    <section
      aria-label="Invoices"
      className="flex flex-col items-center gap-2 rounded-tile-lg bg-tile-tile px-6 py-10 text-center"
    >
      <div className="flex items-center pt-1.5 pb-3" aria-hidden>
        {[FileText, FileCheck, FileClock].map((Icon, i) => (
          <span
            key={i}
            className={cn(
              'grid h-[62px] w-[52px] place-items-center rounded-xl border border-tile-border bg-tile-panel',
              i === 0 && '-rotate-6 text-tile-muted',
              i === 1 && 'z-10 -mx-2.5 -translate-y-1.5 text-tile-accent',
              i === 2 && 'rotate-6 text-tile-muted',
            )}
          >
            <Icon size={20} />
          </span>
        ))}
      </div>
      <h2 className="text-lg font-bold">No invoices yet</h2>
      <p className="max-w-sm text-sm text-tile-muted">
        Invoices you create show up here with their status and due dates.
      </p>
      {!mobile && (
        <Link
          to="/invoices/new"
          className="mt-2 inline-flex items-center gap-[7px] rounded-full bg-tile-fg py-[9px] pr-4 pl-[13px] text-sm font-semibold text-white"
        >
          <Plus size={15} aria-hidden />
          New invoice
        </Link>
      )}
    </section>
  )

  const importHint = (
    <section
      aria-label="Moving from another device?"
      className={cn(
        'flex items-center gap-4 rounded-tile-lg border border-tile-border p-4',
        mobile && 'gap-3 bg-tile-panel',
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tile-tile text-tile-accent">
        <HardDrive size={19} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold">
          {mobile ? 'Switching devices?' : 'Moving from another device?'}
        </span>
        <span className="text-[13px] text-tile-muted">
          {mobile
            ? 'Import a backup file.'
            : 'Import a backup file to bring your invoices, clients and settings here.'}
        </span>
      </div>
      <Button variant="outline" icon={Upload} onClick={backup.pickImport}>
        {mobile ? 'Import' : 'Import backup'}
      </Button>
      {backup.element}
    </section>
  )

  if (mobile) {
    return (
      <div className="flex flex-col gap-[18px]">
        <header className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-tile-muted">Welcome</p>
            <h1 className="text-[30px] leading-tight font-bold tracking-[-1.1px]">Overview</h1>
          </div>
          <Link
            to="/invoices/new"
            aria-label="New invoice"
            className="grid size-11 place-items-center rounded-full bg-tile-fg text-white"
          >
            <Plus size={20} aria-hidden />
          </Link>
        </header>
        <section className="rounded-[20px] border border-tile-border bg-tile-panel p-5">
          {hero}
        </section>
        {setup}
        {emptyList}
        {importHint}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        subtitle="Your invoices at a glance — saved privately in this browser"
        actions={
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-[7px] rounded-full bg-tile-fg py-[9px] pr-4 pl-[13px] text-sm font-semibold text-white"
          >
            <Plus size={15} aria-hidden />
            New invoice
          </Link>
        }
      />
      <section
        aria-label="Welcome"
        className="flex gap-6 rounded-tile-lg border border-tile-border p-5"
      >
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 px-1 pt-1.5 pb-1">
          {hero}
          {setup}
        </div>
        <div className="relative flex h-[400px] w-[440px] shrink-0 justify-center overflow-hidden rounded-tile-lg bg-linear-to-b from-[#e9ecf1] to-[#dce1e8] pt-4">
          <div
            aria-hidden
            className="h-fit overflow-hidden rounded-[4px] bg-white shadow-sm"
            style={{ zoom: 416 / PAGE_WIDTH }}
          >
            <InvoiceDocument template={settings.defaultTemplate} view={view} />
          </div>
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-semibold">
            <Eye size={13} aria-hidden />
            Sample invoice
          </span>
        </div>
      </section>
      {emptyList}
      {importHint}
    </div>
  )
}

function StepNumber({ n, done, onPanel }: { n: number; done: boolean; onPanel?: boolean }) {
  return (
    <span
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
        done
          ? 'bg-tile-success text-white'
          : onPanel
            ? 'bg-tile-tile text-tile-fg'
            : 'bg-tile-panel text-tile-fg',
      )}
    >
      {n}
    </span>
  )
}
