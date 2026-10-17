import { Link } from 'react-router'
import { PageHeader } from '@/ui/PageHeader'

export function NotFoundPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Page not found" subtitle="This link doesn't match anything in Tagy." />
      <Link to="/" className="font-semibold text-tile-accent-ink">
        Back to Overview
      </Link>
    </div>
  )
}
