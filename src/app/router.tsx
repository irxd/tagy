import { lazy } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { EditorPage, NewInvoicePage } from '@/features/editor/EditorPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { SettingsPage, SettingsSubPage } from '@/features/settings/SettingsPage'
import { TemplatesPage } from '@/features/templates/TemplatesPage'
import { PrintPage } from '@/features/print/PrintPage'
import { NotFoundPage } from './NotFoundPage'
import { AppShell } from './shell/AppShell'

// Component gallery, dev builds only (tree-shaken from production).
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: 'kit',
        Component: lazy(() =>
          import('@/features/kit/KitPage').then((m) => ({ default: m.KitPage })),
        ),
      },
    ]
  : []

export const router = createBrowserRouter([
  // Outside the shell: the bare invoice for the print dialog.
  { path: 'print/:id', element: <PrintPage /> },
  {
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'invoices/new', element: <NewInvoicePage /> },
      { path: 'invoices/:id', element: <EditorPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/:section', element: <SettingsSubPage /> },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
