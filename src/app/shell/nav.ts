import { House, LayoutTemplate, Settings, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Extra path prefixes that keep this item active, e.g. the editor under Overview. */
  activeFor?: string[]
}

export const overviewNav: NavItem = {
  to: '/',
  label: 'Overview',
  icon: House,
  activeFor: ['/invoices'],
}
export const templatesNav: NavItem = { to: '/templates', label: 'Templates', icon: LayoutTemplate }
export const clientsNav: NavItem = { to: '/clients', label: 'Clients', icon: Users }
export const settingsNav: NavItem = { to: '/settings', label: 'Settings', icon: Settings }

/** Rail groups on desktop: main areas on top, system at the bottom. */
export const railMain = [overviewNav, templatesNav, clientsNav]
export const railSystem = [settingsNav]

/** Mobile tab bar, in design order. */
export const tabs = [overviewNav, templatesNav, clientsNav, settingsNav]

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.to === '/') {
    return pathname === '/' || (item.activeFor ?? []).some((p) => pathname.startsWith(p))
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}
