import { initials } from '@/ui/initials'
import { templateFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#16161A'
const MUTED = '#74747C'
const RAIL = '#F6F5F2'
const RULE = '#EBEAE6'

/** Template/Studio — details in a side rail, items and total on the right. */
export function StudioTemplate({ view }: { view: InvoiceView }) {
  const { body: text, body: figures } = templateFonts('studio', view.fonts)
  const b = view.business
  const label = 'text-[8px] tracking-[0.8px] uppercase'
  const mono = { fontFamily: figures }

  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex bg-white text-left leading-[1.3]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        fontFamily: text,
      }}
    >
      <aside
        className="flex w-[136px] shrink-0 flex-col gap-[22px] px-5 py-8"
        style={{ background: RAIL }}
      >
        {view.show.logo && b.logoUrl ? (
          <img src={b.logoUrl} alt="" className="size-7 rounded-full bg-white object-contain" />
        ) : (
          <span
            className="grid size-7 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: view.accent }}
          >
            {initials(b.name || '?').toLowerCase()}
          </span>
        )}
        <RailBlock
          label="From"
          labelClass={label}
          font={figures}
          strong={b.name || 'Your business'}
          lines={[
            b.email,
            b.address,
            b.phone,
            view.show.taxId && b.taxId ? `Tax ID ${b.taxId}` : '',
          ]}
        />
        <RailBlock
          label="Bill to"
          labelClass={label}
          font={figures}
          strong={view.client?.name ?? '—'}
          lines={[
            view.client?.email ?? '',
            view.client?.address ?? '',
            view.show.taxId && view.client?.taxId ? `Tax ID ${view.client.taxId}` : '',
          ]}
        />
        <RailBlock label="Issued" labelClass={label} font={figures} strong={view.issued} mono />
        <RailBlock label="Due" labelClass={label} font={figures} strong={view.due} mono />
        {view.reference && (
          <RailBlock label="Ref." labelClass={label} font={figures} strong={view.reference} mono />
        )}
        {view.paymentDetails && (
          <div className="flex flex-col gap-[3px]">
            <span className={label} style={{ ...mono, color: MUTED }}>
              Payment
            </span>
            <span className="text-[9px] break-words whitespace-pre-line" style={{ color: MUTED }}>
              {view.paymentDetails}
            </span>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-[26px] pt-8 pr-6 pb-7 pl-6">
        <header className="flex flex-col gap-1.5">
          <span className="text-[9px] tracking-[0.5px]" style={{ ...mono, color: MUTED }}>
            {view.number}
          </span>
          <span className="text-[30px] leading-none font-semibold tracking-[-1.2px]">Invoice</span>
        </header>

        <div
          className="flex flex-col gap-1 pl-3"
          style={{ borderLeft: `2px solid ${view.accent}` }}
        >
          <span className={label} style={{ ...mono, color: MUTED }}>
            {view.status === 'paid' ? 'Paid' : 'Total due'}
          </span>
          <span
            className="text-[22px] leading-none font-semibold tracking-[-0.6px]"
            style={{ color: view.accent }}
          >
            {view.total}
          </span>
        </div>

        <ul className="flex flex-col gap-3.5">
          {view.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-2 break-inside-avoid">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[10.5px] font-medium">{line.title || 'Untitled item'}</span>
                {line.description && (
                  <span className="text-[8.5px]" style={{ color: MUTED }}>
                    {line.description}
                  </span>
                )}
                <span className="text-[8.5px]" style={{ ...mono, color: MUTED }}>
                  {line.qty} × {line.rate}
                </span>
              </span>
              <span className="text-[10.5px]" style={mono}>
                {line.amount}
              </span>
            </li>
          ))}
        </ul>

        <dl
          className="flex flex-col gap-1.5 pt-3.5 text-[9.5px] break-inside-avoid"
          style={{ borderTop: `1px solid ${RULE}` }}
        >
          <Row label="Subtotal" value={view.subtotal} font={figures} />
          {view.discount && (
            <Row label={view.discount.label} value={view.discount.value} font={figures} />
          )}
          {view.tax && <Row label={view.tax.label} value={view.tax.value} font={figures} />}
          <div className="flex items-center justify-between pt-1.5">
            <dt className="text-[11px] font-semibold">Total</dt>
            <dd className="text-[11px] font-medium" style={mono}>
              {view.totalAmount} {view.currency}
            </dd>
          </div>
        </dl>

        <div className="flex-1" />

        {view.notes && (
          <p className="text-[9px] whitespace-pre-line" style={{ color: MUTED }}>
            {view.notes}
          </p>
        )}
        {view.show.signature && (
          <span
            className="w-[130px] pt-1.5 text-[8.5px]"
            style={{ borderTop: `1px solid ${INK}`, color: MUTED }}
          >
            Authorized signature
          </span>
        )}
      </div>
    </article>
  )
}

function RailBlock({
  label,
  labelClass,
  font,
  strong,
  lines = [],
  mono,
}: {
  label: string
  labelClass: string
  font: string
  strong: string
  lines?: (string | false)[]
  mono?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span className={labelClass} style={{ color: MUTED, fontFamily: font }}>
        {label}
      </span>
      <span
        className="text-[10px] font-semibold break-words"
        style={mono ? { fontFamily: font } : undefined}
      >
        {strong}
      </span>
      {(lines.filter(Boolean) as string[]).map((line) => (
        <span
          key={line}
          className="text-[9px] break-words whitespace-pre-line"
          style={{ color: MUTED }}
        >
          {line}
        </span>
      ))}
    </div>
  )
}

function Row({ label, value, font }: { label: string; value: string; font: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt style={{ color: MUTED }}>{label}</dt>
      <dd style={{ fontFamily: font }}>{value}</dd>
    </div>
  )
}
