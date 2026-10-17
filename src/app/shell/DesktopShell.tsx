import { ReceiptText } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import { cn } from '@/ui/cn'
import { isNavActive, railMain, railSystem, type NavItem } from './nav'

/** ≥ 1024 px: 64 px icon rail + one rounded panel (Desktop · * boards). */
export function DesktopShell() {
  return (
    <div className="flex min-h-dvh gap-4 p-5">
      <nav
        aria-label="Main"
        className="sticky top-5 flex h-[calc(100dvh-40px)] w-16 shrink-0 flex-col items-center justify-between py-3"
      >
        <div className="flex flex-col items-center gap-4">
          <Link
            to="/"
            aria-label="Tagy home"
            className="grid size-11 place-items-center rounded-[13px] bg-tile-fg text-white"
          >
            <ReceiptText size={21} aria-hidden />
          </Link>
          <RailGroup items={railMain} />
        </div>
        <RailGroup items={railSystem} />
      </nav>

      <main className="min-w-0 flex-1 rounded-tile-panel border border-tile-border bg-tile-panel px-10 pt-9 pb-10">
        <Outlet />
      </main>
    </div>
  )
}

function RailGroup({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  return (
    <ul className="flex w-[52px] flex-col items-center gap-1.5 rounded-tile-lg border border-tile-border bg-tile-panel p-2">
      {items.map((item) => {
        const active = isNavActive(item, pathname)
        const Icon = item.icon
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              aria-label={item.label}
              title={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'grid size-9 place-items-center rounded-[11px] transition-colors',
                active ? 'bg-tile-accent text-white' : 'text-tile-fg hover:bg-tile-tile',
              )}
            >
              <Icon size={18} aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
