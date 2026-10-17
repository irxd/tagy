import { createBrowserRouter, type RouteObject } from 'react-router'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { NotFoundPage } from './NotFoundPage'
import { AppShell } from './shell/AppShell'

/*
 * Overview (the start page) loads with the app; every other screen is its
 * own chunk, fetched when first opened (and precached for offline use).
 */

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        // Component gallery, dev builds only (tree-shaken from production).
        path: 'kit',
        lazy: () => import('@/features/kit/KitPage').then((m) => ({ Component: m.KitPage })),
      },
    ]
  : []

export const router = createBrowserRouter([
  // Outside the shell: the bare invoice for the print dialog.
  {
    path: 'print/:id',
    lazy: () => import('@/features/print/PrintPage').then((m) => ({ Component: m.PrintPage })),
  },
  {
    element: <AppShell />,
    // Screens load as separate chunks; show nothing for the moment that takes.
    HydrateFallback: () => null,
    children: [
      { index: true, element: <OverviewPage /> },
      {
        path: 'invoices/new',
        lazy: () =>
          import('@/features/editor/EditorPage').then((m) => ({ Component: m.NewInvoicePage })),
      },
      {
        path: 'invoices/:id',
        lazy: () =>
          import('@/features/editor/EditorPage').then((m) => ({ Component: m.EditorPage })),
      },
      {
        path: 'templates',
        lazy: () =>
          import('@/features/templates/TemplatesPage').then((m) => ({
            Component: m.TemplatesPage,
          })),
      },
      {
        path: 'clients',
        lazy: () =>
          import('@/features/clients/ClientsPage').then((m) => ({ Component: m.ClientsPage })),
      },
      {
        path: 'settings',
        lazy: () =>
          import('@/features/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
      },
      {
        path: 'settings/:section',
        lazy: () =>
          import('@/features/settings/SettingsPage').then((m) => ({
            Component: m.SettingsSubPage,
          })),
      },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
