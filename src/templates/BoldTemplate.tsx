import { templateFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#111111'
const MUTED = '#6E6E73'
const RULE = '#ECECEC'
const WASH = '#F4F4F5'

/**
 * Template/Bold — an accent band leads with the total. Measurements are the
 * design's, at a 416 px page; callers scale the page with CSS `zoom`.
 */
export function BoldTemplate({ view }: { view: InvoiceView }) {
  const { accent } = view
  const label = 'text-[8.5px] font-semibold tracking-[1px] uppercase'
  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex flex-col bg-white text-left leading-[1.25]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        fontFamily: templateFonts('bold', view.font).text,
      }}
    >
      <header
        className="flex flex-col gap-7 pt-7 pr-8 pb-[26px] pl-8 text-white"
        style={{ background: accent }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            {view.show.logo && view.business.logoUrl && (
              <img
                src={view.business.logoUrl}
                alt=""
                className="size-5 rounded-[4px] bg-white object-contain"
              />
            )}
            <span className="truncate text-[13px] font-bold">
              {view.business.name || 'Your business'}
            </span>
          </span>
          <span className="text-[10px] font-medium tracking-[0.5px] text-white/70">
            {view.number}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-semibold tracking-[1.2px] text-white/70">
              {view.status === 'paid' ? 'PAID' : 'AMOUNT DUE'}
            </span>
            <span className="text-[34px] leading-none font-bold tracking-[-1.2px] tabular-nums">
              {view.total}
            </span>
          </div>
          <span className="text-[11px] font-bold tracking-[3px]">INVOICE</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 pt-6 pr-8 pb-7 pl-8">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={label} style={{ color: accent }}>
              Billed to
            </span>
            <span className="text-[11px] font-semibold">{view.client?.name || '—'}</span>
            {view.client?.contact && (
              <span className="text-[10px]" style={{ color: MUTED }}>
                {view.client.contact}
              </span>
            )}
            {view.client?.email && (
              <span className="text-[10px] break-all" style={{ color: MUTED }}>
                {view.client.email}
              </span>
            )}
            {view.client?.address && (
              <span className="text-[10px] whitespace-pre-line" style={{ color: MUTED }}>
                {view.client.address}
              </span>
            )}
            {view.show.taxId && view.client?.taxId && (
              <span className="text-[10px]" style={{ color: MUTED }}>
                Tax ID {view.client.taxId}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className={label} style={{ color: accent }}>
              Issued
            </span>
            <span className="text-[11px] font-semibold">{view.issued}</span>
            {view.reference && (
              <span className="text-[10px]" style={{ color: MUTED }}>
                Ref {view.reference}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className={label} style={{ color: accent }}>
              Due
            </span>
            <span className="text-[11px] font-semibold">{view.due}</span>
            <span className="text-[10px]" style={{ color: MUTED }}>
              {view.dueNote}
            </span>
          </div>
        </div>

        <table className="w-full border-separate border-spacing-0 text-[10.5px]">
          <thead>
            <tr style={{ color: MUTED }} className={label}>
              <Th first>Item</Th>
              <Th className="w-[36px] text-right">Qty</Th>
              <Th className="w-[80px] text-right">Rate</Th>
              <Th last className="w-[80px] text-right">
                Amount
              </Th>
            </tr>
          </thead>
          <tbody>
            {view.lines.map((line, i) => {
              const last = i === view.lines.length - 1
              const cell = 'px-2.5 py-2.5 align-top'
              const border = last ? undefined : { borderBottom: `1px solid ${RULE}` }
              return (
                <tr key={line.id} className="break-inside-avoid">
                  <td className={cell} style={border}>
                    <span className="block font-medium">{line.title || 'Untitled item'}</span>
                    {line.description && (
                      <span className="mt-0.5 block text-[9px]" style={{ color: MUTED }}>
                        {line.description}
                      </span>
                    )}
                  </td>
                  <td
                    className={`${cell} text-right tabular-nums`}
                    style={{ ...border, color: MUTED }}
                  >
                    {line.qty}
                  </td>
                  <td
                    className={`${cell} text-right tabular-nums`}
                    style={{ ...border, color: MUTED }}
                  >
                    {line.rate}
                  </td>
                  <td className={`${cell} text-right font-medium tabular-nums`} style={border}>
                    {line.amount}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex justify-end px-2.5 break-inside-avoid">
          <dl className="flex w-[180px] flex-col gap-1.5 text-[10px]">
            <Row label="Subtotal" value={view.subtotal} />
            {view.discount && <Row label={view.discount.label} value={view.discount.value} />}
            {view.tax && <Row label={view.tax.label} value={view.tax.value} />}
            <div
              className="flex items-center justify-between pt-2"
              style={{ borderTop: `1.5px solid ${INK}` }}
            >
              <dt className="text-[11px] font-bold">Total</dt>
              <dd className="text-[13px] font-bold tabular-nums">{view.total}</dd>
            </div>
          </dl>
        </div>

        {view.notes && (
          <p className="text-[9.5px] whitespace-pre-line" style={{ color: MUTED }}>
            {view.notes}
          </p>
        )}

        <div className="flex-1" />

        <footer className="flex flex-col gap-3 break-inside-avoid">
          {view.paymentDetails && (
            <div
              className="flex flex-col gap-0.5 rounded-[6px] px-3.5 py-3"
              style={{ background: WASH }}
            >
              <span className="text-[10px] font-semibold">Payment details</span>
              <span className="text-[9.5px] whitespace-pre-line" style={{ color: MUTED }}>
                {view.paymentDetails}
              </span>
            </div>
          )}
          <div className="flex items-end justify-between gap-6">
            <p className="text-[8.5px] leading-[1.45]" style={{ color: MUTED }}>
              {[
                view.business.name,
                view.business.address.replace(/\n+/g, ', '),
                view.business.email,
                view.business.phone,
                view.business.website,
                view.show.taxId && view.business.taxId ? `Tax ID ${view.business.taxId}` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {view.show.signature && (
              <span
                className="w-[130px] shrink-0 pt-1.5 text-[8.5px]"
                style={{ borderTop: `1px solid ${INK}`, color: MUTED }}
              >
                Authorized signature
              </span>
            )}
          </div>
        </footer>
      </div>
    </article>
  )
}

function Th({
  children,
  className = '',
  first,
  last,
}: {
  children: string
  className?: string
  first?: boolean
  last?: boolean
}) {
  return (
    <th
      scope="col"
      className={`px-2.5 py-[7px] text-left font-semibold ${className}`}
      style={{
        background: WASH,
        borderTop: `1px solid ${RULE}`,
        borderBottom: `1px solid ${RULE}`,
        borderLeft: first ? `1px solid ${RULE}` : undefined,
        borderRight: last ? `1px solid ${RULE}` : undefined,
        borderRadius: first ? '4px 0 0 4px' : last ? '0 4px 4px 0' : undefined,
      }}
    >
      {children}
    </th>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt style={{ color: MUTED }}>{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
