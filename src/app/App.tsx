import { RouterProvider } from 'react-router'
import { ToastProvider } from '@/ui/Toast'
import { router } from './router'
import { UpdatePrompt } from './UpdatePrompt'

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
      <UpdatePrompt />
    </ToastProvider>
  )
}
