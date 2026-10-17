import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

/** Panel header: page title, one-line subtitle and optional actions on the right. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] leading-tight font-bold tracking-[-1.1px] desk:text-[34px] desk:tracking-[-1.3px]">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-tile-muted desk:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
