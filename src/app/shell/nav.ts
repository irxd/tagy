import { House, LayoutTemplate, Settings, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const overviewNav: NavItem = { to: '/', label: 'Overview', icon: House }
export const templatesNav: NavItem = { to: '/templates', label: 'Templates', icon: LayoutTemplate }
export const clientsNav: NavItem = { to: '/clients', label: 'Clients', icon: Users }
export const settingsNav: NavItem = { to: '/settings', label: 'Settings', icon: Settings }

/** Rail groups on desktop: main areas on top, system at the bottom. */
export const railMain = [overviewNav, templatesNav, clientsNav]
export const railSystem = [settingsNav]

/** Mobile tab bar, in design order. */
export const tabs = [overviewNav, templatesNav, clientsNav, settingsNav]

/** Overview is active only on `/`; the invoice editor highlights no item. */
export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.to === '/') return pathname === '/'
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}
