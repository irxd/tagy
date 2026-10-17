import { templateFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#1F1B16'
const MUTED = '#7A7268'
const RULE = '#E4DED3'
const PAPER = '#FFFDF8'

/** Template/Classic — serif letterhead, double rules, italic labels. */
export function ClassicTemplate({ view }: { view: InvoiceView }) {
  const { text } = templateFonts('classic', view.font)
  const b = view.business
  const accent = view.accent
  const italic = 'italic'
  const letterhead = [b.address.replace(/\n+/g, ', '), b.email, b.phone, b.website]
    .filter(Boolean)
    .join(' · ')
  const clientLine = [
    view.client?.address.replace(/\n+/g, ', '),
    view.client?.email,
    view.show.taxId && view.client?.taxId ? `Tax ID ${view.client.taxId}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex flex-col gap-5 px-9 py-8 text-left leading-[1.3]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        background: PAPER,
        fontFamily: text,
      }}
    >
      <header className="flex flex-col items-center gap-1.5 text-center">
        {view.show.logo && b.logoUrl && (
          <img src={b.logoUrl} alt="" className="mb-1 h-7 w-auto object-contain" />
        )}
        <span className="text-[15px] font-semibold tracking-[3px] uppercase">
          {b.name || 'Your business'}
        </span>
        {letterhead && (
          <span className={`text-[10px] ${italic}`} style={{ color: MUTED }}>
            {letterhead}
          </span>
        )}
        {view.show.taxId && b.taxId && (
          <span className="text-[9.5px]" style={{ color: MUTED }}>
            Tax ID {b.taxId}
          </span>
        )}
      </header>

      <div className="flex flex-col gap-0.5" aria-hidden>
        <span className="h-0.5" style={{ background: accent }} />
        <span className="h-px" style={{ background: accent }} />
      </div>

      <div className="flex items-end justify-between gap-4">
        <span className="text-[34px] leading-none tracking-[-0.5px] italic">Invoice</span>
        <dl className="grid grid-cols-[auto_auto] gap-x-2 gap-y-[3px] text-right">
          <Meta label="No." value={view.number} />
          <Meta label="Issued" value={view.issued} />
          <Meta label="Due" value={view.due} />
          {view.reference && <Meta label="Ref." value={view.reference} />}
        </dl>
      </div>

      <div className="flex flex-col gap-[3px]">
        <span className="text-[10px] italic" style={{ color: MUTED }}>
          Billed to
        </span>
        <span className="text-[13px] font-semibold">{view.client?.name ?? '—'}</span>
        {clientLine && (
          <span className="text-[10.5px]" style={{ color: MUTED }}>
            {clientLine}
          </span>
        )}
      </div>

      <table
        className="w-full border-collapse text-[11px]"
        style={{ borderTop: `1px solid ${INK}` }}
      >
        <thead>
          <tr
            className="text-[9.5px] italic"
            style={{ color: MUTED, borderBottom: `1px solid ${INK}` }}
          >
            <th scope="col" className="py-[7px] text-left font-normal">
              Description
            </th>
            <th scope="col" className="w-[40px] py-[7px] text-right font-normal">
              Qty
            </th>
            <th scope="col" className="w-[84px] py-[7px] text-right font-normal">
              Rate
            </th>
            <th scope="col" className="w-[84px] py-[7px] text-right font-normal">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {view.lines.map((line, i) => (
            <tr
              key={line.id}
              className="break-inside-avoid align-top"
              style={
                i < view.lines.length - 1 ? { borderBottom: `0.75px solid ${RULE}` } : undefined
              }
            >
              <td className="py-[9px] pr-3">
                {line.title || 'Untitled item'}
                {line.description && (
                  <span className="block text-[9.5px] italic" style={{ color: MUTED }}>
                    {line.description}
                  </span>
                )}
              </td>
              <td className="py-[9px] text-right">{line.qty}</td>
              <td className="py-[9px] text-right">{line.rate}</td>
              <td className="py-[9px] text-right">{line.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end break-inside-avoid">
        <dl className="flex w-[190px] flex-col gap-[5px] text-[10.5px]">
          <Row label="Subtotal" value={view.subtotal} />
          {view.discount && <Row label={view.discount.label} value={view.discount.value} />}
          {view.tax && <Row label={view.tax.label} value={view.tax.value} />}
          <div
            className="flex items-center justify-between py-2"
            style={{ borderTop: `1.5px solid ${accent}`, borderBottom: `1.5px solid ${accent}` }}
          >
            <dt className="text-[11.5px] font-semibold">Amount due</dt>
            <dd className="text-[15px] font-semibold" style={{ color: accent }}>
              {view.total}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex-1" />

      <footer className="flex flex-col items-center gap-1 pt-2 text-center break-inside-avoid">
        <span className="text-[12px] whitespace-pre-line italic">
          {view.notes || 'Thank you for your business.'}
        </span>
        {view.paymentDetails && (
          <span className="text-[9.5px] whitespace-pre-line" style={{ color: MUTED }}>
            {view.paymentDetails}
          </span>
        )}
        {view.show.signature && (
          <span
            className="mt-5 w-[150px] pt-1.5 text-[9.5px] italic"
            style={{ borderTop: `1px solid ${INK}`, color: MUTED }}
          >
            Authorized signature
          </span>
        )}
      </footer>
    </article>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[10px] italic" style={{ color: MUTED }}>
        {label}
      </dt>
      <dd className="text-[10.5px]">{value}</dd>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="italic" style={{ color: MUTED }}>
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  )
}
