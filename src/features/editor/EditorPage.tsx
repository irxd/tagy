import { useParams } from 'react-router'
import { PageHeader } from '@/ui/PageHeader'

export function EditorPage() {
  const { id } = useParams()
  return (
    <PageHeader
      title={id ? 'Invoice' : 'New invoice'}
      subtitle="Every change is autosaved in this browser"
    />
  )
}
