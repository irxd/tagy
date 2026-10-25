import type { ReactNode } from 'react'
import { fitInvoiceTitle, fontIds, templateFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#151515'
const SOFT = '#55534E'
const MUTED = '#8C8A84'
const FAINT = '#ABA9A2'
const PAPER = '#F5F4EF'
const RULE = `0.8px solid #3A3A3A`

/**
 * Template/Editorial Mono — poster-scale condensed serif title on warm
 * paper over typewriter mono, a pill invoice number and a ruled Total
 * line. The board is drawn at 416 px; sizes here are scaled to the 560 px
 * page, with wider side margins than drawn so nothing prints off the edge.
 */
export function EditorialMonoTemplate({ view }: { view: InvoiceView }) {
  const { heading, body } = templateFonts('studio', view.fonts)
  const title = fitInvoiceTitle(fontIds('studio', view.fonts).heading, 135, 512)
  const b = view.business
  const c = view.client
  const caps = 'text-[9px] tracking-[1.6px] uppercase'
  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex flex-col px-6 pt-[22px] pb-[19px] text-left leading-[1.5]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        background: PAPER,
        fontFamily: body,
        printColorAdjust: 'exact',
      }}
    >
      <header>
        <h1
          className="leading-[0.9] font-normal whitespace-nowrap"
          style={{ fontFamily: heading, fontSize: title, letterSpacing: -title * 0.016 }}
        >
          INVOICE
        </h1>
      </header>

      <div className="mt-8 flex items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-4 break-words">
          <Party label="From" name={b.name || 'Your business'}>
            {[
              b.email,
              [b.phone, b.website].filter(Boolean).join(' · '),
              b.address,
              view.show.taxId && b.taxId ? `Tax ID ${b.taxId}` : '',
            ]}
          </Party>
          <Party label="To" name={c?.name || '—'}>
            {[
              c?.contact,
              c?.email,
              c?.address,
              view.show.taxId && c?.taxId ? `Tax ID ${c.taxId}` : '',
            ]}
          </Party>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-4">
          <div className="flex flex-col items-end gap-[3px]">
            <div className="flex items-start gap-[7px] pr-[19px]">
              <Key>Issued</Key>
              <svg width="46" height="14" viewBox="0 0 34 11" className="mt-1.5" aria-hidden>
                <path d="M0 4h33.5v7" fill="none" stroke={INK} strokeWidth="0.6" />
              </svg>
            </div>
            <span
              className="rounded-full px-[22px] py-[7px] text-[16px] leading-[1.1]"
              style={{ border: `0.95px solid ${INK}` }}
            >
              {view.number} / {view.issued}
            </span>
          </div>
          {view.reference && (
            <Block label="Ref">
              <span className="text-[11px]">{view.reference}</span>
            </Block>
          )}
          <Block label="Due">
            <span className="text-[20px] leading-[1.1]">{view.due}</span>
            <span className="text-[9px]" style={{ color: MUTED }}>
              {view.dueNote}
            </span>
          </Block>
        </div>
      </div>

      <div className="min-h-4 flex-1" />

      <table className="w-full table-fixed border-collapse text-[9.5px]">
        <colgroup>
          <col />
          <col className="w-[81px]" />
          <col className="w-[81px]" />
          <col className="w-[81px]" />
        </colgroup>
        <thead>
          <tr className={caps} style={{ borderBottom: RULE }}>
            <th scope="col" className="pb-[11px] text-left font-normal">
              Services
            </th>
            <th scope="col" className="pb-[11px] text-right font-normal">
              Rate
            </th>
            <th scope="col" className="pb-[11px] text-right font-normal">
              Qty
            </th>
            <th scope="col" className="pb-[11px] text-right font-normal">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {view.lines.map((line, i) => (
            <tr key={line.id} className="break-inside-avoid align-top">
              <td className={i === 0 ? 'pt-[15px] pr-3' : 'pt-[13px] pr-3'}>
                {line.title || 'Untitled item'}
                {line.description && (
                  <span
                    className="mt-px block text-[9px] whitespace-pre-line"
                    style={{ color: MUTED }}
                  >
                    {line.description}
                  </span>
                )}
              </td>
              <td className={i === 0 ? 'pt-[15px] text-right' : 'pt-[13px] text-right'}>
                {line.rate}
              </td>
              <td className={i === 0 ? 'pt-[15px] text-right' : 'pt-[13px] text-right'}>
                {line.qty}
              </td>
              <td className={i === 0 ? 'pt-[15px] text-right' : 'pt-[13px] text-right'}>
                {line.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="min-h-4 flex-1" />

      <dl className="flex flex-col gap-1 break-inside-avoid">
        <Row label="Subtotal" value={view.subtotal} caps={caps} />
        {view.discount && (
          <Row label={view.discount.label} value={view.discount.value} caps={caps} />
        )}
        {view.tax && <Row label={view.tax.label} value={view.tax.value} caps={caps} />}
        <div className="flex items-center gap-4">
          <dt className="text-[31px] leading-none" style={{ fontFamily: heading }}>
            Total
          </dt>
          <span className="h-0 flex-1" style={{ borderTop: RULE }} aria-hidden />
          <dd className="text-[25.5px] leading-[1.1]" style={{ color: view.accent }}>
            {view.total}
          </dd>
        </div>
      </dl>

      {(view.notes || view.paymentDetails || view.show.signature) && (
        <footer
          className="mt-5 flex items-end justify-between gap-6 text-[9px] break-inside-avoid"
          style={{ color: FAINT }}
        >
          <div className="flex min-w-0 flex-col gap-1.5 whitespace-pre-line">
            {view.notes && <span>{view.notes}</span>}
            {view.paymentDetails && <span>{view.paymentDetails}</span>}
          </div>
          {view.show.signature && (
            <span className="w-[175px] shrink-0 pt-1.5" style={{ borderTop: `0.8px solid ${INK}` }}>
              Authorized signature
            </span>
          )}
        </footer>
      )}
    </article>
  )
}

function Key({ children }: { children: ReactNode }) {
  return <span className="text-[9.5px] tracking-[0.67px] uppercase">{children}</span>
}

function Party({
  label,
  name,
  children,
}: {
  label: string
  name: string
  children: (string | false | undefined)[]
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      <Key>{label}</Key>
      <div className="flex flex-col">
        <span className="text-[11px]" style={{ color: SOFT }}>
          {name}
        </span>
        {children.filter(Boolean).map((line) => (
          <span
            key={line as string}
            className="text-[9px] whitespace-pre-line"
            style={{ color: MUTED }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  )
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[3px] pr-[19px]">
      <Key>{label}</Key>
      {children}
    </div>
  )
}

function Row({ label, value, caps }: { label: string; value: string; caps: string }) {
  return (
    <div className={`flex justify-between gap-3 ${caps}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
