import type { CSSProperties, ReactNode } from 'react'
import { templateFonts } from './fonts'
import { LogoMark } from './LogoMark'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#111111'
const MUTED = '#6E6E6E'
const LINE = `0.8px solid ${MUTED}`

/**
 * Template/Serif Ledger — bookish serif, one ruled box that ties the
 * parties, items and totals together; the totals hang off the right column
 * like a ledger tab. The board is drawn at 416 px with 7.5 px text; sizes
 * here are scaled to the 560 px page.
 */
export function SerifLedgerTemplate({ view }: { view: InvoiceView }) {
  const { heading, body } = templateFonts('classic', view.fonts)
  const b = view.business
  const c = view.client
  const label = 'text-[7.5px] italic'
  const cell = 'px-[11px] pt-[11px] pb-[13px]'
  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex flex-col bg-white px-[38px] py-[35px] text-left text-[10px] leading-[1.55]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        fontFamily: body,
      }}
    >
      <header className="flex items-center justify-between gap-6">
        <h1
          className="text-[46px] leading-none font-normal tracking-[-0.67px]"
          style={{ fontFamily: heading }}
        >
          Invoice
        </h1>
        <LogoMark view={view} />
      </header>

      <div className="mt-[30px] grid grid-cols-2 gap-x-3">
        <div className="min-w-0 break-words">
          <div>Invoice no.: {view.number}</div>
          {view.reference && <div>Reference: {view.reference}</div>}
          {view.paymentDetails && <div className="whitespace-pre-line">{view.paymentDetails}</div>}
        </div>
        <div>
          <div>Invoice date: {view.issued}</div>
          <div>
            Due date: {view.due}
            <span style={{ color: MUTED }}> · {view.dueNote}</span>
          </div>
        </div>
      </div>

      <div className="min-h-[30px] flex-1" />

      <div style={{ border: LINE }}>
        <div className="grid grid-cols-2">
          <Party label="Seller" labelClass={label} className={cell} style={{ borderRight: LINE }}>
            <div>{b.name || 'Your business'}</div>
            {view.show.taxId && b.taxId && <div>Tax ID: {b.taxId}</div>}
            {b.address && <div className="whitespace-pre-line">{b.address}</div>}
          </Party>
          <Party label="Recipient" labelClass={label} className={cell}>
            <div>{c?.name || '—'}</div>
            {c?.contact && <div>{c.contact}</div>}
            {c?.email && <div>{c.email}</div>}
            {view.show.taxId && c?.taxId && <div>Tax ID: {c.taxId}</div>}
            {c?.address && <div className="whitespace-pre-line">{c.address}</div>}
          </Party>
        </div>

        <div className={cell} style={{ borderTop: LINE }}>
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-1/2" />
              <col className="w-[65px]" />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className={label}>
                <th scope="col" className="pr-[11px] pb-1 text-left font-normal">
                  Item
                </th>
                <th scope="col" className="pb-1 pl-[11px] text-left font-normal">
                  Qty
                </th>
                <th scope="col" className="pb-1 text-right font-normal">
                  Rate
                </th>
                <th scope="col" className="pb-1 text-right font-normal">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {view.lines.map((line) => (
                <tr key={line.id} className="break-inside-avoid align-top">
                  <td className="pr-[11px] pb-[3px]">
                    {line.title || 'Untitled item'}
                    {line.description && (
                      <span className="block whitespace-pre-line" style={{ color: MUTED }}>
                        {line.description}
                      </span>
                    )}
                  </td>
                  <td className="pl-[11px]">{line.qty}</td>
                  <td className="text-right">{line.rate}</td>
                  <td className="text-right">{line.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 break-inside-avoid">
        <dl
          className={`col-start-2 flex flex-col gap-[3px] ${cell}`}
          style={{ borderLeft: LINE, borderRight: LINE, borderBottom: LINE }}
        >
          <Row label="Subtotal" value={view.subtotal} />
          {view.discount && <Row label={view.discount.label} value={view.discount.value} />}
          {view.tax && <Row label={view.tax.label} value={view.tax.value} />}
          <div
            className="flex justify-between gap-3 text-[11.5px] font-bold"
            style={{ color: view.accent }}
          >
            <dt>Total</dt>
            <dd>{view.total}</dd>
          </div>
        </dl>
      </div>

      <div className="min-h-[30px] flex-1" />

      <footer className="grid grid-cols-2 items-end gap-x-3 break-inside-avoid">
        <div className="flex flex-col">
          {view.notes && <span className="whitespace-pre-line">{view.notes}</span>}
          {view.show.signature && (
            <span
              className="mt-7 w-[175px] pt-1.5"
              style={{ borderTop: `0.8px solid ${INK}`, color: MUTED }}
            >
              Authorized signature
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-1.5">
          <div className="flex min-w-0 flex-col break-words">
            {[b.email, b.phone].filter(Boolean).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          {b.website && <span className="break-words">{b.website}</span>}
        </div>
      </footer>
    </article>
  )
}

function Party({
  label,
  labelClass,
  className,
  style,
  children,
}: {
  label: string
  labelClass: string
  className: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-[5px] break-words ${className}`} style={style}>
      <span className={labelClass}>{label}</span>
      <div>{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
