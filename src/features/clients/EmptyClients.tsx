import { ChartNoAxesColumn, Plus, Settings2, UserPlus, Zap, type LucideIcon } from 'lucide-react'
import { Button } from '@/ui/Button'
import { cn } from '@/ui/cn'

/** Clients — Empty: a soft stage with sample cards, then three reasons to add clients. */
export function EmptyClients({ mobile, onAdd }: { mobile: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-tile-xl bg-tile-tile px-6 py-10 text-center desk:py-14">
        <div className="flex items-center pb-4" aria-hidden>
          <MiniCard initials="AC" className="-rotate-6" />
          <MiniCard initials="NS" accent className="z-10 -mx-3.5 -translate-y-1.5" />
          <MiniCard initials="LB" className="rotate-6" />
        </div>
        <h2 className="text-[22px] font-bold tracking-[-0.5px]">No clients yet</h2>
        <p className="max-w-md text-[15px] text-tile-muted">
          Save a client once and pick them in a {mobile ? 'tap' : 'click'} next time. Or just type a
          name on an invoice — we&apos;ll offer to save it.
        </p>
        <div className={cn('pt-1.5', mobile && 'w-full')}>
          <Button
            variant="dark"
            size={mobile ? 'lg' : 'md'}
            icon={mobile ? UserPlus : Plus}
            onClick={onAdd}
          >
            Add client
          </Button>
        </div>
      </div>
      <ul
        className={cn(
          mobile
            ? 'flex flex-col rounded-[18px] border border-tile-border bg-tile-panel px-3.5 py-0.5'
            : 'grid grid-cols-3 gap-4',
        )}
      >
        <Reason mobile={mobile} icon={Zap} title="Faster invoices">
          Address, email and tax ID fill in automatically.
        </Reason>
        <Reason mobile={mobile} icon={Settings2} title="Per-client defaults">
          Set a currency and payment terms for each client.
        </Reason>
        <Reason mobile={mobile} icon={ChartNoAxesColumn} title="See who owes what">
          Unpaid and total billed, per client, at a glance.
        </Reason>
      </ul>
    </div>
  )
}

function MiniCard({
  initials,
  accent,
  className,
}: {
  initials: string
  accent?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex w-[120px] flex-col gap-2 rounded-[14px] border border-tile-border bg-tile-panel p-3',
        className,
      )}
    >
      <span
        className={cn(
          'grid size-7 place-items-center rounded-full text-[10px] font-bold',
          accent ? 'bg-tile-accent text-white' : 'bg-tile-tile-strong text-tile-muted',
        )}
      >
        {initials}
      </span>
      <span className="h-1.5 w-[72px] rounded-[3px] bg-tile-tile-strong" />
      <span className="h-1.5 w-12 rounded-[3px] bg-tile-tile" />
    </div>
  )
}

function Reason({
  mobile,
  icon: Icon,
  title,
  children,
}: {
  mobile: boolean
  icon: LucideIcon
  title: string
  children: string
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-3',
        mobile
          ? 'border-b border-tile-border py-3 last:border-b-0'
          : 'rounded-tile-lg border border-tile-border p-4',
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-tile-tile">
        <Icon size={17} aria-hidden />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{title}</span>
        <span className="text-[13px] text-tile-muted">{children}</span>
      </span>
    </li>
  )
}
