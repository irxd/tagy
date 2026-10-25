import { initials } from '@/ui/initials'
import type { InvoiceView } from './view'

/** The business logo, or its initial in an accent circle when there's none. */
export function LogoMark({ view }: { view: InvoiceView }) {
  const b = view.business
  return view.show.logo && b.logoUrl ? (
    <img src={b.logoUrl} alt="" className="size-[38px] shrink-0 object-contain" />
  ) : (
    <span
      className="grid size-[38px] shrink-0 place-items-center rounded-full text-[16px] font-semibold text-white"
      style={{ background: view.accent }}
    >
      {initials(b.name || '?').slice(0, 1)}
    </span>
  )
}
