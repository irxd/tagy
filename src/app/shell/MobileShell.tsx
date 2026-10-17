import { Link, Outlet, useLocation } from 'react-router'
import { cn } from '@/ui/cn'
import { isNavActive, tabs } from './nav'

/** < 1024 px: stacked content with a floating pill tab bar (Mobile · * boards). */
export function MobileShell() {
  const { pathname } = useLocation()
  // The invoice editor is a step flow with its own action bar, so it hides the tabs.
  const showTabs = !pathname.startsWith('/invoices')

  return (
    <div className="min-h-dvh">
      <main className={cn('px-4 pt-4', showTabs ? 'pb-28' : 'pb-0')}>
        <Outlet />
      </main>

      {showTabs && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 px-4 pb-[max(12px,env(safe-area-inset-bottom))]"
        >
          <ul className="mx-auto flex h-16 max-w-md items-center gap-0.5 rounded-full border border-tile-border bg-white/85 p-1.5 shadow-tile-float backdrop-blur-xl">
            {tabs.map((item) => {
              const active = isNavActive(item, pathname)
              const Icon = item.icon
              return (
                <li key={item.to} className="flex-1">
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-[52px] flex-col items-center justify-center gap-[3px] rounded-[26px] text-[10px]',
                      active
                        ? 'bg-tile-accent-soft font-bold text-tile-accent'
                        : 'font-medium text-tile-muted',
                    )}
                  >
                    <Icon size={22} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
