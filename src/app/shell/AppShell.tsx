import { useLayout } from '@/ui/useLayout'
import { DesktopShell } from './DesktopShell'
import { MobileShell } from './MobileShell'

export function AppShell() {
  return useLayout() === 'desktop' ? <DesktopShell /> : <MobileShell />
}
