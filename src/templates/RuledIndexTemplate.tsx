import type { ReactNode } from 'react'
import { templateFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#111111'
const MUTED = '#7A7A7A'
const BAND = '#F1F2F2'
const RULE = '0.8px solid #8F8F8F'

/**
 * Template/Ruled Index — a stack of full-width ruled rows, each split in two
 * columns: wordmark, client, a grey band of services, totals, terms,
 * contact and registration, closed by a large INVOICE and number. The board
 * is drawn at 416 px; sizes here are scaled to the 560 px page, with wider
 * side margins than drawn so nothing prints off the edge.
 */
export function RuledIndexTemplate({ view }: { view: InvoiceView }) {
  const { heading, body } = templateFonts('bold', view.fonts)
  const b = view.business
  const c = view.client
  const cell = 'py-[11px]'
  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex flex-col bg-white text-left text-[10px] leading-[1.3]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        fontFamily: body,
        printColorAdjust: 'exact',
      }}
    >
      <header
        className="h-[97px] px-6 pt-4 text-[30px] leading-none tracking-[-0.8px] break-words"
        style={{ borderBottom: RULE, fontFamily: heading }}
      >
        {b.name || 'Your business'}
      </header>

      <Split
        left={[
          view.issued,
          view.reference && `Reference ${view.reference}`,
          c?.name || '—',
          c?.contact,
          c?.email,
          view.show.taxId && c?.taxId && `Tax ID ${c.taxId}`,
        ]}
        right={[c?.address]}
      />

      <div className="flex flex-1 flex-col" style={{ background: BAND, borderBottom: RULE }}>
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-1/2" />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="bg-white" style={{ borderBottom: RULE }}>
              <th scope="col" className={`${cell} pr-3 pl-6 text-left font-normal`}>
                Service
              </th>
              <th scope="col" className={`${cell} text-left font-normal`}>
                Unit cost
              </th>
              <th scope="col" className={`${cell} text-left font-normal`}>
                Quantity
              </th>
              <th scope="col" className={`${cell} pr-6 text-right font-normal`}>
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {view.lines.map((line, i) => {
              const pad = `${i === 0 ? 'pt-3' : 'pt-0'} ${i === view.lines.length - 1 ? 'pb-3' : 'pb-[9px]'}`
              return (
                <tr key={line.id} className="break-inside-avoid align-top">
                  <td className={`${pad} pr-3 pl-6`}>
                    {line.title || 'Untitled item'}
                    {line.description && (
                      <span className="block whitespace-pre-line" style={{ color: MUTED }}>
                        {line.description}
                      </span>
                    )}
                  </td>
                  <td className={pad}>{line.rate}</td>
                  <td className={pad}>{line.qty}</td>
                  <td className={`${pad} pr-6 text-right`}>{line.amount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div
        className="grid grid-cols-2 px-6 pt-[11px] pb-3 break-inside-avoid"
        style={{ borderBottom: RULE }}
      >
        <dl className="col-start-2 flex flex-col">
          <Row label="Subtotal" value={view.subtotal} />
          {view.discount && <Row label={view.discount.label} value={view.discount.value} />}
          {view.tax && <Row label={view.tax.label} value={view.tax.value} />}
          <div className="flex justify-between gap-3 pt-1" style={{ color: view.accent }}>
            <dt>Total</dt>
            <dd>{view.total}</dd>
          </div>
        </dl>
      </div>

      <Row2>
        <dl className="grid grid-cols-[118px_1fr]">
          <dt>Payment terms</dt>
          <dd>{view.terms}</dd>
          <dt>Invoice issued</dt>
          <dd>{view.issued}</dd>
          <dt>Due date</dt>
          <dd>
            {view.due}
            <span style={{ color: MUTED }}> · {view.dueNote}</span>
          </dd>
        </dl>
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
      </Row2>

      <Split left={[b.address]} right={[b.email, b.phone, b.website]} />
      <Split
        left={[view.show.taxId && b.taxId && `Tax ID ${b.taxId}`]}
        right={[view.paymentDetails]}
      />

      <footer
        className="flex h-[129px] shrink-0 items-end justify-between gap-6 px-6 pb-[13px] text-[35px] leading-none tracking-[-0.8px] break-inside-avoid"
        style={{ fontFamily: heading }}
      >
        <span>INVOICE</span>
        <span className="min-w-0 truncate">{view.number}</span>
      </footer>
    </article>
  )
}

/** A ruled row of two columns of lines; skipped when both are empty. */
function Split({
  left,
  right,
}: {
  left: (string | false | null | undefined)[]
  right: (string | false | null | undefined)[]
}) {
  const l = left.filter(Boolean) as string[]
  const r = right.filter(Boolean) as string[]
  if (!l.length && !r.length) return null
  const column = (lines: string[]) => (
    <div className="flex min-w-0 flex-col break-words whitespace-pre-line">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  )
  return (
    <Row2>
      {column(l)}
      {column(r)}
    </Row2>
  )
}

function Row2({ children }: { children: ReactNode }) {
  return (
    <div
      className="grid grid-cols-2 px-6 py-[11px] break-inside-avoid *:pr-3"
      style={{ borderBottom: RULE }}
    >
      {children}
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
