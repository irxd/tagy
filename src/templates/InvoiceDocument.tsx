import type { ReactNode } from 'react'
import type { TemplateId } from '@/db/types'
import { BoldTemplate } from './BoldTemplate'
import type { InvoiceView } from './view'

const templates: Record<TemplateId, (props: { view: InvoiceView }) => ReactNode> = {
  bold: BoldTemplate,
  // Minimal, Classic and Studio arrive in phase 4; until then they render Bold.
  minimal: BoldTemplate,
  classic: BoldTemplate,
  studio: BoldTemplate,
}

/** One invoice page in the chosen template, at the template's authored size. */
export function InvoiceDocument({ template, view }: { template: TemplateId; view: InvoiceView }) {
  const Template = templates[template]
  return <Template view={view} />
}
