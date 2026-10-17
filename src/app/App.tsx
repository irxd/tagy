import { RouterProvider } from 'react-router'
import { ToastProvider } from '@/ui/Toast'
import { router } from './router'

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
