import type { ReactNode } from 'react'
import type { TemplateId } from '@/db/types'
import { BoldTemplate } from './BoldTemplate'
import { ClassicTemplate } from './ClassicTemplate'
import { MinimalTemplate } from './MinimalTemplate'
import { StudioTemplate } from './StudioTemplate'
import type { InvoiceView } from './view'

const templates: Record<TemplateId, (props: { view: InvoiceView }) => ReactNode> = {
  minimal: MinimalTemplate,
  classic: ClassicTemplate,
  bold: BoldTemplate,
  studio: StudioTemplate,
}

/** One invoice page in the chosen template, at the template's authored size. */
export function InvoiceDocument({ template, view }: { template: TemplateId; view: InvoiceView }) {
  const Template = templates[template]
  return <Template view={view} />
}
