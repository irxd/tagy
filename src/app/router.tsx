import { createBrowserRouter } from 'react-router'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { EditorPage } from '@/features/editor/EditorPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TemplatesPage } from '@/features/templates/TemplatesPage'
import { NotFoundPage } from './NotFoundPage'
import { AppShell } from './shell/AppShell'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'invoices/new', element: <EditorPage /> },
      { path: 'invoices/:id', element: <EditorPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
