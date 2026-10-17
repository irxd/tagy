import { lazy } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { EditorPage } from '@/features/editor/EditorPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TemplatesPage } from '@/features/templates/TemplatesPage'
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
  {
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'invoices/new', element: <EditorPage /> },
      { path: 'invoices/:id', element: <EditorPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
