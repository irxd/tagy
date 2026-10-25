import type { ReactNode } from 'react'
import type { TemplateId } from '@/db/types'
import { BoldTemplate } from './BoldTemplate'
import { SerifLedgerTemplate } from './SerifLedgerTemplate'
import { StudioTemplate } from './StudioTemplate'
import { SwissLedgerTemplate } from './SwissLedgerTemplate'
import type { InvoiceView } from './view'

const templates: Record<TemplateId, (props: { view: InvoiceView }) => ReactNode> = {
  minimal: SwissLedgerTemplate,
  classic: SerifLedgerTemplate,
  bold: BoldTemplate,
  studio: StudioTemplate,
}

/** One invoice page in the chosen template, at the template's authored size. */
export function InvoiceDocument({ template, view }: { template: TemplateId; view: InvoiceView }) {
  const Template = templates[template]
  return <Template view={view} />
}
