import type { ReactNode } from 'react'
import { initials } from '@/ui/initials'
import { templateFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type InvoiceView } from './view'

const INK = '#111111'
const MUTED = '#8A8A8A'
const RULE = '#D9D9D9'

/**
 * Template/Swiss Ledger — oversized sender block as the masthead, everything
 * else small on a two-column grid, hairline rules only. The board is drawn
 * at 416 px with 7.5 px text; sizes here are scaled to the 560 px page.
 */
export function SwissLedgerTemplate({ view }: { view: InvoiceView }) {
  const { text, figures } = templateFonts('minimal', view.font)
  const num = { fontFamily: figures }
  const b = view.business
  const c = view.client
  const rule = { borderTop: `0.5px solid ${RULE}` }
  return (
    <article
      aria-label={`Invoice ${view.number}`}
      className="flex flex-col bg-white px-[38px] pt-[38px] pb-[35px] text-left text-[10px] leading-[1.55]"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT[view.paper],
        color: INK,
        fontFamily: text,
      }}
    >
      <header className="flex justify-between gap-6">
        <div className="min-w-0 text-[19px] leading-[1.2] tracking-[-0.15px] break-words whitespace-pre-line">
          <div>{b.name || 'Your business'}</div>
          {view.show.taxId && b.taxId && <div>Tax ID: {b.taxId}</div>}
          {b.address && <div>{b.address}</div>}
        </div>
        {view.show.logo && b.logoUrl ? (
          <img src={b.logoUrl} alt="" className="size-[38px] shrink-0 object-contain" />
        ) : (
          <span
            className="grid size-[38px] shrink-0 place-items-center rounded-full text-[16px] font-semibold text-white"
            style={{ background: view.accent }}
          >
            {initials(b.name || '?').slice(0, 1)}
          </span>
        )}
      </header>

      <div className="mt-[35px] grid grid-cols-2">
        <Block label="Invoice">
          <div>
            Invoice no.: <span style={num}>{view.number}</span>
          </div>
          {view.reference && <div>Reference: {view.reference}</div>}
          <div>
            Invoice date: <span style={num}>{view.issued}</span>
          </div>
          <div>
            Due date: <span style={num}>{view.due}</span>
            <span style={{ color: MUTED }}> · {view.dueNote}</span>
          </div>
          {view.paymentDetails && <div className="whitespace-pre-line">{view.paymentDetails}</div>}
        </Block>
        <Block label="Recipient">
          <div>{c?.name || '—'}</div>
          {c?.contact && <div>{c.contact}</div>}
          {c?.email && <div>{c.email}</div>}
          {view.show.taxId && c?.taxId && <div>Tax ID: {c.taxId}</div>}
          {c?.address && <div className="whitespace-pre-line">{c.address}</div>}
        </Block>
      </div>

      <div className="min-h-[35px] flex-1" />

      <table className="w-full table-fixed border-collapse" style={rule}>
        <colgroup>
          <col className="w-1/2" />
          <col className="w-[54px]" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="font-medium">
            <th scope="col" className="pt-4 pb-[9px] text-left font-medium">
              Item
            </th>
            <th scope="col" className="pt-4 pb-[9px] text-left font-medium">
              Qty
            </th>
            <th scope="col" className="pt-4 pb-[9px] text-right font-medium">
              Rate
            </th>
            <th scope="col" className="pt-4 pb-[9px] text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {view.lines.map((line, i) => (
            <tr key={line.id} className="break-inside-avoid align-top">
              <td className={i === view.lines.length - 1 ? 'pr-3 pb-4' : 'pr-3 pb-1'}>
                {line.title || 'Untitled item'}
                {line.description && (
                  <span className="block whitespace-pre-line" style={{ color: MUTED }}>
                    {line.description}
                  </span>
                )}
              </td>
              <td style={num}>{line.qty}</td>
              <td className="text-right" style={num}>
                {line.rate}
              </td>
              <td className="text-right" style={num}>
                {line.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="flex flex-col gap-1 pt-4 break-inside-avoid" style={rule}>
        <Row label="Subtotal" value={view.subtotal} font={figures} />
        {view.discount && (
          <Row label={view.discount.label} value={view.discount.value} font={figures} />
        )}
        {view.tax && <Row label={view.tax.label} value={view.tax.value} font={figures} />}
        <div className="flex justify-between gap-3 font-semibold" style={{ color: view.accent }}>
          <dt>Total</dt>
          <dd style={num}>{view.total}</dd>
        </div>
      </dl>

      <div className="min-h-[35px] flex-1" />

      <footer className="grid grid-cols-2 items-end break-inside-avoid">
        <div className="flex flex-col" style={{ color: MUTED }}>
          {[b.email, b.phone, b.website].filter(Boolean).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="flex flex-col">
          {view.notes && <span className="whitespace-pre-line">{view.notes}</span>}
          {view.show.signature && (
            <span
              className="mt-7 w-[175px] pt-1.5"
              style={{ borderTop: `0.5px solid ${INK}`, color: MUTED }}
            >
              Authorized signature
            </span>
          )}
        </div>
      </footer>
    </article>
  )
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 pr-3 break-words">
      <span className="font-medium">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function Row({ label, value, font }: { label: string; value: string; font: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd style={{ fontFamily: font }}>{value}</dd>
    </div>
  )
}
