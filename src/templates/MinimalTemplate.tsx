import { initials } from '@/ui/initials'
import { templateFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#141414'
const MUTED = '#6B6B6B'
const RULE = '#E8E8E5'

/** Template/Minimal — ink on paper, mono figures, hairline rules. */
export function MinimalTemplate({ view }: { view: InvoiceView }) {
  const { text, figures } = templateFonts('minimal', view.font)
  const label = 'text-[8px] font-medium tracking-[0.8px] uppercase'
  const num = { fontFamily: figures }
  const b = view.business
  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex flex-col gap-5 bg-white p-8 text-left leading-[1.3]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        fontFamily: text,
      }}
    >
      <header className="flex justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2">
          {view.show.logo && b.logoUrl ? (
            <img src={b.logoUrl} alt="" className="size-5 rounded-[5px] object-contain" />
          ) : (
            <span
              className="grid size-5 shrink-0 place-items-center rounded-[5px] text-[10px] font-semibold text-white"
              style={{ background: view.accent, ...num }}
            >
              {initials(b.name || '?').slice(0, 1)}
            </span>
          )}
          <span className="truncate text-[13px] font-semibold">{b.name || 'Your business'}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="text-[22px] leading-none font-medium tracking-[-0.6px]">Invoice</span>
          <span className="text-[10px]" style={{ ...num, color: MUTED }}>
            {view.number}
          </span>
        </span>
      </header>

      <div
        className="grid grid-cols-3 gap-4 py-3.5"
        style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}
      >
        <Meta label="Issued" value={view.issued} font={figures} className={label} />
        <Meta label="Due" value={view.due} font={figures} className={label} />
        <Meta label="Amount due" value={view.total} font={figures} className={label} big />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Party
          label="From"
          labelClass={label}
          labelFont={figures}
          lines={[
            b.name,
            b.email,
            b.address,
            view.show.taxId && b.taxId ? `Tax ID ${b.taxId}` : '',
          ]}
        />
        <Party
          label="Bill to"
          labelClass={label}
          labelFont={figures}
          lines={[
            view.client?.name ?? '—',
            view.client?.email ?? '',
            view.client?.address ?? '',
            view.show.taxId && view.client?.taxId ? `Tax ID ${view.client.taxId}` : '',
          ]}
        />
      </div>

      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className={label} style={{ color: MUTED, borderBottom: `1px solid ${RULE}`, ...num }}>
            <th scope="col" className="py-1.5 text-left font-medium">
              Description
            </th>
            <th scope="col" className="w-[44px] py-1.5 text-right font-medium">
              Qty
            </th>
            <th scope="col" className="w-[84px] py-1.5 text-right font-medium">
              Rate
            </th>
            <th scope="col" className="w-[84px] py-1.5 text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {view.lines.map((line, i) => (
            <tr
              key={line.id}
              className="break-inside-avoid align-top"
              style={i < view.lines.length - 1 ? { borderBottom: `1px solid ${RULE}` } : undefined}
            >
              <td className="py-[9px] pr-3">
                {line.title || 'Untitled item'}
                {line.description && (
                  <span className="block text-[8.5px]" style={{ color: MUTED }}>
                    {line.description}
                  </span>
                )}
              </td>
              <td className="py-[9px] text-right" style={{ ...num, color: MUTED }}>
                {line.qty}
              </td>
              <td className="py-[9px] text-right" style={{ ...num, color: MUTED }}>
                {line.rate}
              </td>
              <td className="py-[9px] text-right font-medium" style={num}>
                {line.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end break-inside-avoid">
        <dl className="flex w-[180px] flex-col gap-1.5 text-[10px]">
          <Row label="Subtotal" value={view.subtotal} font={figures} />
          {view.discount && (
            <Row label={view.discount.label} value={view.discount.value} font={figures} />
          )}
          {view.tax && <Row label={view.tax.label} value={view.tax.value} font={figures} />}
          <div
            className="flex items-center justify-between pt-2"
            style={{ borderTop: `1px solid ${INK}` }}
          >
            <dt className="text-[11px] font-semibold">Total due</dt>
            <dd className="text-[13px] font-semibold" style={num}>
              {view.total}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex-1" />

      {(view.notes || view.paymentDetails || view.show.signature) && (
        <footer
          className="grid grid-cols-2 gap-4 pt-3.5 break-inside-avoid"
          style={{ borderTop: `1px solid ${RULE}` }}
        >
          <Note label="Notes" labelClass={label} labelFont={figures} text={view.notes} />
          <Note
            label="Payment"
            labelClass={label}
            labelFont={figures}
            text={view.paymentDetails ?? ''}
          />
          {view.show.signature && (
            <span
              className="col-start-2 mt-4 pt-1.5 text-[8.5px]"
              style={{ borderTop: `1px solid ${INK}`, color: MUTED }}
            >
              Authorized signature
            </span>
          )}
        </footer>
      )}
    </article>
  )
}

function Meta({
  label,
  value,
  font,
  className,
  big,
}: {
  label: string
  value: string
  font: string
  className: string
  big?: boolean
}) {
  return (
    <div className="flex flex-col gap-[5px]" style={{ fontFamily: font }}>
      <span className={className} style={{ color: MUTED }}>
        {label}
      </span>
      <span className={big ? 'text-[13px] font-medium' : 'text-[11px] font-medium'}>{value}</span>
    </div>
  )
}

function Party({
  label,
  labelClass,
  labelFont,
  lines,
}: {
  label: string
  labelClass: string
  labelFont: string
  lines: (string | false)[]
}) {
  const [first, ...rest] = lines.filter(Boolean) as string[]
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span className={labelClass} style={{ color: MUTED, fontFamily: labelFont }}>
        {label}
      </span>
      <span className="text-[11px] font-medium">{first ?? '—'}</span>
      {rest.map((line) => (
        <span
          key={line}
          className="text-[10px] break-words whitespace-pre-line"
          style={{ color: MUTED }}
        >
          {line}
        </span>
      ))}
    </div>
  )
}

function Note({
  label,
  labelClass,
  labelFont,
  text,
}: {
  label: string
  labelClass: string
  labelFont: string
  text: string
}) {
  if (!text) return <div />
  return (
    <div className="flex flex-col gap-1">
      <span className={labelClass} style={{ color: MUTED, fontFamily: labelFont }}>
        {label}
      </span>
      <span className="text-[9px] whitespace-pre-line" style={{ color: MUTED }}>
        {text}
      </span>
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
