import { Document, Image, Page, Path, Svg, Text, View, type Styles } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { TemplateId } from '@/db/types'
import { fitInvoiceTitle, fontIds } from '@/templates/fonts'
import { PAGE_WIDTH, type InvoiceView } from '@/templates/view'
import { initials } from '@/ui/initials'
import { pdfFonts } from './fonts'

/*
 * PDF versions of the four templates, drawn with React-PDF from the same
 * InvoiceView as the HTML templates. Sizes are the HTML templates' px at the
 * 560 px page, scaled to points by `u` so both match the same proportions.
 */

type Style = Styles[string]
const PAPER_PT = {
  a4: { w: 595.28, size: 'A4' as const },
  letter: { w: 612, size: 'LETTER' as const },
}

interface Ctx {
  view: InvoiceView
  u: (px: number) => number
  heading: string
  body: string
}

export function InvoicePdf({ view, template }: { view: InvoiceView; template: TemplateId }) {
  const paper = PAPER_PT[view.paper]
  const k = paper.w / PAGE_WIDTH
  const fonts = pdfFonts(template, view.fonts)
  const ctx: Ctx = { view, u: (px) => px * k, ...fonts }
  const Body = {
    minimal: SwissLedger,
    classic: SerifLedger,
    bold: RuledIndex,
    studio: EditorialMono,
  }[template]
  return (
    <Document
      title={`Invoice ${view.number}`}
      author={view.business.name || undefined}
      subject={view.client ? `Invoice for ${view.client.name}` : undefined}
      creator="Tagy"
      producer="Tagy"
    >
      <Body {...ctx} />
    </Document>
  )
}

/* ---------- shared pieces ---------- */

function T({ style, children }: { style?: Style; children: ReactNode }) {
  return <Text style={style}>{children}</Text>
}

const pick = <V,>(lines: (V | false | '' | null | undefined)[]) => lines.filter(Boolean) as V[]

/** The business logo, or its initial in an accent circle when there's none. */
function LogoMark({ ctx }: { ctx: Ctx }) {
  const { view, u } = ctx
  const b = view.business
  if (view.show.logo && b.logoUrl)
    return <Image src={b.logoUrl} style={{ width: u(38), height: u(38), objectFit: 'contain' }} />
  return (
    <View
      style={{
        width: u(38),
        height: u(38),
        borderRadius: u(19),
        backgroundColor: view.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <T style={{ color: 'white', fontSize: u(16), fontWeight: 600, lineHeight: 1 }}>
        {initials(b.name || '?').slice(0, 1)}
      </T>
    </View>
  )
}

function TotalsRows({
  ctx,
  labelStyle,
  valueStyle,
}: {
  ctx: Ctx
  labelStyle: Style
  valueStyle: Style
}) {
  const { view } = ctx
  const rows = pick<{ label: string; value: string }>([
    { label: 'Subtotal', value: view.subtotal },
    view.discount,
    view.tax,
  ])
  return (
    <>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T style={labelStyle}>{r.label}</T>
          <T style={valueStyle}>{r.value}</T>
        </View>
      ))}
    </>
  )
}

/* ---------- Ruled Index ---------- */

function RuledIndex(ctx: Ctx) {
  const { view, u, heading, body } = ctx
  const INK = '#111111'
  const MUTED = '#7A7A7A'
  const rule: Style = { borderBottomWidth: u(0.8), borderColor: '#8F8F8F' }
  const b = view.business
  const c = view.client
  const pad: Style = { paddingHorizontal: u(24), paddingVertical: u(11) }
  const cols: Style[] = [
    { width: '50%', paddingRight: u(12) },
    { flex: 1 },
    { flex: 1 },
    { flex: 1, textAlign: 'right' },
  ]
  const row2 = (left: ReactNode, right: ReactNode) => (
    <View wrap={false} style={{ flexDirection: 'row', ...pad, ...rule }}>
      <View style={{ width: '50%', paddingRight: u(12) }}>{left}</View>
      <View style={{ width: '50%', paddingRight: u(12) }}>{right}</View>
    </View>
  )
  const lines = (ls: string[]) => ls.map((l) => <T key={l}>{l}</T>)
  const split = (left: (string | false | null | undefined)[], right: typeof left) => {
    const l = pick<string>(left)
    const r = pick<string>(right)
    return l.length || r.length ? row2(lines(l), lines(r)) : null
  }

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{ fontFamily: body, color: INK, fontSize: u(10), lineHeight: 1.3 }}
    >
      <View style={{ flexGrow: 1 }}>
        <View
          style={{
            height: u(97),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: u(24),
            paddingHorizontal: u(24),
            paddingTop: u(16),
            ...rule,
          }}
        >
          <T
            style={{
              flexShrink: 1,
              fontFamily: heading,
              fontSize: u(30),
              letterSpacing: u(-0.8),
              lineHeight: 1,
            }}
          >
            {b.name || 'Your business'}
          </T>
          <LogoMark ctx={ctx} />
        </View>

        {split(
          [
            view.issued,
            view.reference && `Reference ${view.reference}`,
            c?.name || '—',
            c?.contact,
            c?.email,
            view.show.taxId && c?.taxId && `Tax ID ${c.taxId}`,
          ],
          [c?.address],
        )}

        <View style={{ flexGrow: 1, backgroundColor: '#F1F2F2', ...rule }}>
          <View fixed style={{ flexDirection: 'row', backgroundColor: 'white', ...pad, ...rule }}>
            {['Service', 'Unit cost', 'Quantity', 'Subtotal'].map((h, i) => (
              <T key={h} style={cols[i]}>
                {h}
              </T>
            ))}
          </View>
          {/* Rows carry their own top space so a row starting a new page clears the header. */}
          <View style={{ paddingHorizontal: u(24), paddingBottom: u(12) }}>
            {view.lines.map((l, i) => {
              const [item, rate, qty, amount] = cols
              return (
                <View
                  key={l.id}
                  wrap={false}
                  style={{ flexDirection: 'row', paddingTop: u(i === 0 ? 12 : 9) }}
                >
                  <View style={item}>
                    <T>{l.title || 'Untitled item'}</T>
                    {l.description && <T style={{ color: MUTED }}>{l.description}</T>}
                  </View>
                  <T style={rate}>{l.rate}</T>
                  <T style={qty}>{l.qty}</T>
                  <T style={amount}>{l.amount}</T>
                </View>
              )
            })}
          </View>
        </View>

        <View
          wrap={false}
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: u(24),
            paddingTop: u(11),
            paddingBottom: u(12),
            ...rule,
          }}
        >
          <View style={{ width: '50%' }}>
            <TotalsRows ctx={ctx} labelStyle={{}} valueStyle={{}} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: u(4),
                color: view.accent,
              }}
            >
              <T>Total</T>
              <T>{view.total}</T>
            </View>
          </View>
        </View>

        {row2(
          [
            ['Payment terms', view.terms],
            ['Invoice issued', view.issued],
          ]
            .map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row' }}>
                <T style={{ width: u(118) }}>{k}</T>
                <T>{v}</T>
              </View>
            ))
            .concat(
              <View key="due" style={{ flexDirection: 'row' }}>
                <T style={{ width: u(118) }}>Due date</T>
                <T>
                  {view.due}
                  <T style={{ color: MUTED }}> · {view.dueNote}</T>
                </T>
              </View>,
            ),
          <>
            {view.notes && <T>{view.notes}</T>}
            {view.show.signature && (
              <T
                style={{
                  width: u(175),
                  marginTop: u(28),
                  paddingTop: u(6),
                  borderTopWidth: u(0.8),
                  borderColor: INK,
                  color: MUTED,
                }}
              >
                Authorized signature
              </T>
            )}
          </>,
        )}

        {split([b.address], [b.email, b.phone, b.website])}
        {split([view.show.taxId && b.taxId && `Tax ID ${b.taxId}`], [view.paymentDetails])}

        <View
          wrap={false}
          style={{
            height: u(129),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: u(24),
            paddingHorizontal: u(24),
            paddingBottom: u(13),
            fontFamily: heading,
            fontSize: u(35),
            letterSpacing: u(-0.8),
            lineHeight: 1,
          }}
        >
          <T>INVOICE</T>
          <T>{view.number}</T>
        </View>
      </View>
    </Page>
  )
}

/* ---------- Swiss Ledger ---------- */

function SwissLedger(ctx: Ctx) {
  const { view, u, heading, body } = ctx
  const INK = '#111111'
  const MUTED = '#8A8A8A'
  const RULE = '#D9D9D9'
  const b = view.business
  const c = view.client
  const rule: Style = { borderTopWidth: u(0.5), borderColor: RULE }
  const half: Style = { width: '50%', paddingRight: u(12) }
  const cells: Style[] = [
    half,
    { width: u(54) },
    { flex: 1, textAlign: 'right' },
    { flex: 1, textAlign: 'right' },
  ]
  const spacer = <View style={{ flexGrow: 1, minHeight: u(35) }} />

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{
        fontFamily: body,
        color: INK,
        fontSize: u(10),
        lineHeight: 1.55,
        paddingTop: u(38),
        paddingHorizontal: u(38),
        paddingBottom: u(35),
      }}
    >
      <View style={{ flexGrow: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: u(24) }}>
          <View
            style={{
              flex: 1,
              fontFamily: heading,
              fontSize: u(19),
              lineHeight: 1.2,
              letterSpacing: u(-0.15),
            }}
          >
            <T>{b.name || 'Your business'}</T>
            {view.show.taxId && b.taxId && <T>Tax ID: {b.taxId}</T>}
            {b.address && <T>{b.address}</T>}
          </View>
          <LogoMark ctx={ctx} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: u(35) }}>
          <View style={{ ...half, gap: u(8) }}>
            <T style={{ fontWeight: 500 }}>Invoice</T>
            <View>
              <T>Invoice no.: {view.number}</T>
              {view.reference && <T>Reference: {view.reference}</T>}
              <T>Invoice date: {view.issued}</T>
              <T>
                Due date: {view.due}
                <T style={{ color: MUTED }}> · {view.dueNote}</T>
              </T>
              {view.paymentDetails && <T>{view.paymentDetails}</T>}
            </View>
          </View>
          <View style={{ ...half, gap: u(8) }}>
            <T style={{ fontWeight: 500 }}>Recipient</T>
            <View>
              {pick<string>([
                c?.name || '—',
                c?.contact,
                c?.email,
                view.show.taxId && c?.taxId ? `Tax ID: ${c.taxId}` : '',
                c?.address,
              ]).map((line) => (
                <T key={line}>{line}</T>
              ))}
            </View>
          </View>
        </View>

        {spacer}

        <View style={{ ...rule, paddingTop: u(16), paddingBottom: u(16) }}>
          <View fixed style={{ flexDirection: 'row', fontWeight: 500, paddingBottom: u(9) }}>
            {['Item', 'Qty', 'Rate', 'Amount'].map((h, i) => (
              <T key={h} style={cells[i]}>
                {h}
              </T>
            ))}
          </View>
          {view.lines.map((line) => {
            const [item, qty, rate, amount] = cells
            return (
              <View
                key={line.id}
                wrap={false}
                style={{ flexDirection: 'row', paddingBottom: u(4) }}
              >
                <View style={item}>
                  <T>{line.title || 'Untitled item'}</T>
                  {line.description && <T style={{ color: MUTED }}>{line.description}</T>}
                </View>
                <T style={qty}>{line.qty}</T>
                <T style={rate}>{line.rate}</T>
                <T style={amount}>{line.amount}</T>
              </View>
            )
          })}
        </View>

        <View wrap={false} style={{ ...rule, paddingTop: u(16), gap: u(4) }}>
          <TotalsRows ctx={ctx} labelStyle={{}} valueStyle={{}} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              fontWeight: 600,
              color: view.accent,
            }}
          >
            <T>Total</T>
            <T>{view.total}</T>
          </View>
        </View>

        {spacer}

        <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={{ ...half, color: MUTED }}>
            {pick<string>([b.email, b.phone, b.website]).map((line) => (
              <T key={line}>{line}</T>
            ))}
          </View>
          <View style={half}>
            {view.notes && <T>{view.notes}</T>}
            {view.show.signature && (
              <T
                style={{
                  width: u(175),
                  marginTop: u(28),
                  paddingTop: u(6),
                  borderTopWidth: u(0.5),
                  borderColor: INK,
                  color: MUTED,
                }}
              >
                Authorized signature
              </T>
            )}
          </View>
        </View>
      </View>
    </Page>
  )
}

/* ---------- Serif Ledger ---------- */

function SerifLedger(ctx: Ctx) {
  const { view, u, heading, body } = ctx
  const INK = '#111111'
  const MUTED = '#6E6E6E'
  const b = view.business
  const c = view.client
  const line = u(0.8)
  const label: Style = { fontSize: u(7.5), fontStyle: 'italic' }
  const cell: Style = { paddingTop: u(11), paddingHorizontal: u(11), paddingBottom: u(13) }
  const cells: Style[] = [
    { width: '50%', paddingRight: u(11) },
    { width: u(65), paddingLeft: u(11) },
    { flex: 1, textAlign: 'right' },
    { flex: 1, textAlign: 'right' },
  ]
  const spacer = <View style={{ flexGrow: 1, minHeight: u(30) }} />
  const party = (title: string, lines: string[], style: Style = {}) => (
    <View style={{ width: '50%', gap: u(5), ...cell, ...style }}>
      <T style={label}>{title}</T>
      <View>
        {lines.map((l) => (
          <T key={l}>{l}</T>
        ))}
      </View>
    </View>
  )

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{
        fontFamily: body,
        color: INK,
        fontSize: u(10),
        lineHeight: 1.55,
        paddingVertical: u(35),
        paddingHorizontal: u(38),
      }}
    >
      <View style={{ flexGrow: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: u(24),
          }}
        >
          <T
            style={{ fontFamily: heading, fontSize: u(46), lineHeight: 1, letterSpacing: u(-0.67) }}
          >
            Invoice
          </T>
          <LogoMark ctx={ctx} />
        </View>

        <View style={{ flexDirection: 'row', gap: u(12), marginTop: u(30) }}>
          <View style={{ flex: 1 }}>
            <T>Invoice no.: {view.number}</T>
            {view.reference && <T>Reference: {view.reference}</T>}
            {view.paymentDetails && <T>{view.paymentDetails}</T>}
          </View>
          <View style={{ flex: 1 }}>
            <T>Invoice date: {view.issued}</T>
            <T>
              Due date: {view.due}
              <T style={{ color: MUTED }}> · {view.dueNote}</T>
            </T>
          </View>
        </View>

        {spacer}

        <View style={{ borderWidth: line, borderColor: MUTED }}>
          <View style={{ flexDirection: 'row' }}>
            {party(
              'Seller',
              pick<string>([
                b.name || 'Your business',
                view.show.taxId && b.taxId ? `Tax ID: ${b.taxId}` : '',
                b.address,
              ]),
              { borderRightWidth: line, borderColor: MUTED },
            )}
            {party(
              'Recipient',
              pick<string>([
                c?.name || '—',
                c?.contact,
                c?.email,
                view.show.taxId && c?.taxId ? `Tax ID: ${c.taxId}` : '',
                c?.address,
              ]),
            )}
          </View>
          <View style={{ ...cell, borderTopWidth: line, borderColor: MUTED }}>
            <View fixed style={{ flexDirection: 'row', paddingBottom: u(4), ...label }}>
              {['Item', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <T key={h} style={cells[i]}>
                  {h}
                </T>
              ))}
            </View>
            {view.lines.map((l) => {
              const [item, qty, rate, amount] = cells
              return (
                <View key={l.id} wrap={false} style={{ flexDirection: 'row', paddingBottom: u(3) }}>
                  <View style={item}>
                    <T>{l.title || 'Untitled item'}</T>
                    {l.description && <T style={{ color: MUTED }}>{l.description}</T>}
                  </View>
                  <T style={qty}>{l.qty}</T>
                  <T style={rate}>{l.rate}</T>
                  <T style={amount}>{l.amount}</T>
                </View>
              )
            })}
          </View>
        </View>

        <View wrap={false} style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <View
            style={{
              width: '50%',
              gap: u(3),
              ...cell,
              borderLeftWidth: line,
              borderRightWidth: line,
              borderBottomWidth: line,
              borderColor: MUTED,
            }}
          >
            <TotalsRows ctx={ctx} labelStyle={{}} valueStyle={{}} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                fontSize: u(11.5),
                fontWeight: 700,
                color: view.accent,
              }}
            >
              <T>Total</T>
              <T>{view.total}</T>
            </View>
          </View>
        </View>

        {spacer}

        <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: u(12) }}>
          <View style={{ flex: 1 }}>
            {view.notes && <T>{view.notes}</T>}
            {view.show.signature && (
              <T
                style={{
                  width: u(175),
                  marginTop: u(28),
                  paddingTop: u(6),
                  borderTopWidth: line,
                  borderColor: INK,
                  color: MUTED,
                }}
              >
                Authorized signature
              </T>
            )}
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: u(6),
            }}
          >
            <View>
              {pick<string>([b.email, b.phone]).map((l) => (
                <T key={l}>{l}</T>
              ))}
            </View>
            {b.website && <T>{b.website}</T>}
          </View>
        </View>
      </View>
    </Page>
  )
}

/* ---------- Editorial Mono ---------- */

function EditorialMono(ctx: Ctx) {
  const { view, u, heading, body } = ctx
  const INK = '#151515'
  const SOFT = '#55534E'
  const MUTED = '#8C8A84'
  const FAINT = '#ABA9A2'
  const RULE = '#3A3A3A'
  const b = view.business
  const c = view.client
  const title = fitInvoiceTitle(fontIds('studio', view.fonts).heading, 135, 458)
  const caps: Style = { fontSize: u(9), letterSpacing: u(1.6), textTransform: 'uppercase' }
  const key: Style = { fontSize: u(9.5), letterSpacing: u(0.67), textTransform: 'uppercase' }
  const cols: Style[] = [
    { flex: 1, paddingRight: u(12) },
    { width: u(81), textAlign: 'right' },
    { width: u(81), textAlign: 'right' },
    { width: u(81), textAlign: 'right' },
  ]
  const spacer = <View style={{ flexGrow: 1, minHeight: u(16) }} />
  const party = (label: string, name: string, lines: string[]) => (
    <View style={{ gap: u(3) }}>
      <T style={key}>{label}</T>
      <View>
        <T style={{ fontSize: u(11), color: SOFT }}>{name}</T>
        {lines.map((l) => (
          <T key={l} style={{ fontSize: u(9), color: MUTED }}>
            {l}
          </T>
        ))}
      </View>
    </View>
  )
  const block = (label: string, children: ReactNode) => (
    <View style={{ gap: u(3), paddingRight: u(19) }}>
      <T style={key}>{label}</T>
      {children}
    </View>
  )

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{
        fontFamily: body,
        color: INK,
        backgroundColor: '#F5F4EF',
        fontSize: u(9.5),
        lineHeight: 1.5,
        paddingTop: u(22),
        paddingHorizontal: u(24),
        paddingBottom: u(19),
      }}
    >
      <View style={{ flexGrow: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: u(16),
          }}
        >
          <T
            style={{
              fontFamily: heading,
              fontSize: u(title),
              letterSpacing: u(-title * 0.016),
              lineHeight: 0.9,
            }}
          >
            INVOICE
          </T>
          <LogoMark ctx={ctx} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: u(24),
            marginTop: u(32),
          }}
        >
          <View style={{ flexShrink: 1, gap: u(16) }}>
            {party(
              'From',
              b.name || 'Your business',
              pick<string>([
                b.email,
                [b.phone, b.website].filter(Boolean).join(' · '),
                b.address,
                view.show.taxId && b.taxId ? `Tax ID ${b.taxId}` : '',
              ]),
            )}
            {party(
              'To',
              c?.name || '—',
              pick<string>([
                c?.contact,
                c?.email,
                c?.address,
                view.show.taxId && c?.taxId ? `Tax ID ${c.taxId}` : '',
              ]),
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: u(16) }}>
            <View style={{ alignItems: 'flex-end', gap: u(3) }}>
              <View style={{ flexDirection: 'row', gap: u(7), paddingRight: u(19) }}>
                <T style={key}>Issued</T>
                <Svg width={u(46)} height={u(14)} viewBox="0 0 34 11" style={{ marginTop: u(6) }}>
                  <Path d="M0 4h33.5v7" stroke={INK} strokeWidth={0.6} fill="none" />
                </Svg>
              </View>
              <T
                style={{
                  fontSize: u(16),
                  lineHeight: 1.1,
                  paddingVertical: u(7),
                  paddingHorizontal: u(22),
                  borderWidth: u(0.95),
                  borderColor: INK,
                  borderRadius: u(40),
                }}
              >
                {view.number} / {view.issued}
              </T>
            </View>
            {view.reference && block('Ref', <T style={{ fontSize: u(11) }}>{view.reference}</T>)}
            {block(
              'Due',
              <View>
                <T style={{ fontSize: u(20), lineHeight: 1.1 }}>{view.due}</T>
                <T style={{ fontSize: u(9), color: MUTED }}>{view.dueNote}</T>
              </View>,
            )}
          </View>
        </View>

        {spacer}

        <View>
          <View
            fixed
            style={{
              flexDirection: 'row',
              paddingBottom: u(11),
              borderBottomWidth: u(0.8),
              borderColor: RULE,
              ...caps,
            }}
          >
            {['Services', 'Rate', 'Qty', 'Total'].map((h, i) => (
              <T key={h} style={cols[i]}>
                {h}
              </T>
            ))}
          </View>
          {view.lines.map((l, i) => {
            const [item, rate, qty, amount] = cols
            return (
              <View
                key={l.id}
                wrap={false}
                style={{ flexDirection: 'row', paddingTop: u(i === 0 ? 15 : 13) }}
              >
                <View style={item}>
                  <T>{l.title || 'Untitled item'}</T>
                  {l.description && (
                    <T style={{ fontSize: u(9), color: MUTED, marginTop: u(1) }}>{l.description}</T>
                  )}
                </View>
                <T style={rate}>{l.rate}</T>
                <T style={qty}>{l.qty}</T>
                <T style={amount}>{l.amount}</T>
              </View>
            )
          })}
        </View>

        {spacer}

        <View wrap={false} style={{ gap: u(4) }}>
          <TotalsRows ctx={ctx} labelStyle={caps} valueStyle={caps} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(16) }}>
            <T style={{ fontFamily: heading, fontSize: u(31), lineHeight: 1 }}>Total</T>
            <View style={{ flex: 1, borderTopWidth: u(0.8), borderColor: RULE }} />
            <T style={{ fontSize: u(25.5), lineHeight: 1.1, color: view.accent }}>{view.total}</T>
          </View>
        </View>

        {(view.notes || view.paymentDetails || view.show.signature) && (
          <View
            wrap={false}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: u(24),
              marginTop: u(20),
              fontSize: u(9),
              color: FAINT,
            }}
          >
            <View style={{ flexShrink: 1, gap: u(6) }}>
              {view.notes && <T>{view.notes}</T>}
              {view.paymentDetails && <T>{view.paymentDetails}</T>}
            </View>
            {view.show.signature && (
              <T
                style={{
                  width: u(175),
                  flexShrink: 0,
                  paddingTop: u(6),
                  borderTopWidth: u(0.8),
                  borderColor: INK,
                }}
              >
                Authorized signature
              </T>
            )}
          </View>
        )}
      </View>
    </Page>
  )
}
