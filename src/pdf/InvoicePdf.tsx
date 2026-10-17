import { Document, Image, Page, Text, View, type Styles } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { TemplateId } from '@/db/types'
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
  text: string
  figures: string
}

export function InvoicePdf({ view, template }: { view: InvoiceView; template: TemplateId }) {
  const paper = PAPER_PT[view.paper]
  const k = paper.w / PAGE_WIDTH
  const fonts = pdfFonts(template, view.font)
  const ctx: Ctx = { view, u: (px) => px * k, ...fonts }
  const Body = { minimal: Minimal, classic: Classic, bold: Bold, studio: Studio }[template]
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

function businessLine(view: InvoiceView) {
  const b = view.business
  return pick<string>([
    b.name,
    b.address.replace(/\n+/g, ', '),
    b.email,
    b.phone,
    b.website,
    view.show.taxId && b.taxId ? `Tax ID ${b.taxId}` : '',
  ]).join(' · ')
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

/* ---------- Bold ---------- */

function Bold(ctx: Ctx) {
  const { view, u, text } = ctx
  const INK = '#111111'
  const MUTED = '#6E6E73'
  const RULE = '#ECECEC'
  const WASH = '#F4F4F5'
  const label: Style = {
    fontSize: u(8.5),
    fontWeight: 600,
    letterSpacing: u(1),
    color: view.accent,
  }
  const small: Style = { fontSize: u(10), color: MUTED }
  const cell = (w: number | null, align: 'left' | 'right' = 'right'): Style =>
    w ? { width: u(w), textAlign: align } : { flex: 1, textAlign: align }

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{ fontFamily: text, color: INK, fontSize: u(10.5), lineHeight: 1.25 }}
    >
      <View
        style={{
          backgroundColor: view.accent,
          paddingTop: u(28),
          paddingHorizontal: u(32),
          paddingBottom: u(26),
          color: 'white',
        }}
      >
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(8) }}>
            {view.show.logo && view.business.logoUrl && (
              <Image
                src={view.business.logoUrl}
                style={{
                  width: u(20),
                  height: u(20),
                  borderRadius: u(4),
                  backgroundColor: 'white',
                  objectFit: 'contain',
                }}
              />
            )}
            <T style={{ fontSize: u(13), fontWeight: 700 }}>
              {view.business.name || 'Your business'}
            </T>
          </View>
          <T style={{ fontSize: u(10), fontWeight: 500, letterSpacing: u(0.5), opacity: 0.7 }}>
            {view.number}
          </T>
        </View>
        <View
          style={{
            marginTop: u(28),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <View style={{ gap: u(4) }}>
            <T style={{ fontSize: u(9), fontWeight: 600, letterSpacing: u(1.2), opacity: 0.7 }}>
              {view.status === 'paid' ? 'PAID' : 'AMOUNT DUE'}
            </T>
            <T style={{ fontSize: u(34), fontWeight: 700, letterSpacing: u(-1.2), lineHeight: 1 }}>
              {view.total}
            </T>
          </View>
          <T style={{ fontSize: u(11), fontWeight: 700, letterSpacing: u(3) }}>INVOICE</T>
        </View>
      </View>

      <View
        style={{
          flexGrow: 1,
          paddingTop: u(24),
          paddingHorizontal: u(32),
          paddingBottom: u(28),
          gap: u(20),
        }}
      >
        <View style={{ flexDirection: 'row', gap: u(16) }}>
          <View style={{ flex: 2, gap: u(4) }}>
            <T style={label}>BILLED TO</T>
            <T style={{ fontSize: u(11), fontWeight: 600 }}>{view.client?.name ?? '—'}</T>
            {pick<string>([
              view.client?.contact,
              view.client?.email,
              view.client?.address,
              view.show.taxId && view.client?.taxId ? `Tax ID ${view.client.taxId}` : '',
            ]).map((line) => (
              <T key={line} style={small}>
                {line}
              </T>
            ))}
          </View>
          <View style={{ flex: 1, gap: u(4) }}>
            <T style={label}>ISSUED</T>
            <T style={{ fontSize: u(11), fontWeight: 600 }}>{view.issued}</T>
            {view.reference && <T style={small}>Ref {view.reference}</T>}
          </View>
          <View style={{ flex: 1, gap: u(4) }}>
            <T style={label}>DUE</T>
            <T style={{ fontSize: u(11), fontWeight: 600 }}>{view.due}</T>
            <T style={small}>{view.dueNote}</T>
          </View>
        </View>

        <View>
          <View
            fixed
            style={{
              flexDirection: 'row',
              backgroundColor: WASH,
              borderWidth: 1,
              borderColor: RULE,
              borderRadius: u(4),
              paddingVertical: u(7),
              paddingHorizontal: u(10),
              gap: u(12),
              fontSize: u(8.5),
              fontWeight: 600,
              letterSpacing: u(1),
              color: MUTED,
            }}
          >
            <T style={cell(null, 'left')}>ITEM</T>
            <T style={cell(36)}>QTY</T>
            <T style={cell(80)}>RATE</T>
            <T style={cell(80)}>AMOUNT</T>
          </View>
          {view.lines.map((line, i) => (
            <View
              key={line.id}
              wrap={false}
              style={{
                flexDirection: 'row',
                padding: u(10),
                gap: u(12),
                borderBottomWidth: i < view.lines.length - 1 ? 1 : 0,
                borderColor: RULE,
              }}
            >
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: 500 }}>{line.title || 'Untitled item'}</T>
                {line.description && (
                  <T style={{ fontSize: u(9), color: MUTED, marginTop: u(2) }}>
                    {line.description}
                  </T>
                )}
              </View>
              <T style={{ ...cell(36), color: MUTED }}>{line.qty}</T>
              <T style={{ ...cell(80), color: MUTED }}>{line.rate}</T>
              <T style={{ ...cell(80), fontWeight: 500 }}>{line.amount}</T>
            </View>
          ))}
        </View>

        <View
          wrap={false}
          style={{
            alignSelf: 'flex-end',
            width: u(180),
            marginRight: u(10),
            gap: u(6),
            fontSize: u(10),
          }}
        >
          <TotalsRows ctx={ctx} labelStyle={{ color: MUTED }} valueStyle={{ fontWeight: 500 }} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopWidth: u(1.5),
              borderColor: INK,
              paddingTop: u(8),
            }}
          >
            <T style={{ fontSize: u(11), fontWeight: 700 }}>Total</T>
            <T style={{ fontSize: u(13), fontWeight: 700 }}>{view.total}</T>
          </View>
        </View>

        {view.notes && <T style={{ fontSize: u(9.5), color: MUTED }}>{view.notes}</T>}

        <View style={{ flexGrow: 1 }} />

        <View wrap={false} style={{ gap: u(12) }}>
          {view.paymentDetails && (
            <View
              style={{
                backgroundColor: WASH,
                borderRadius: u(6),
                paddingVertical: u(12),
                paddingHorizontal: u(14),
                gap: u(2),
              }}
            >
              <T style={{ fontSize: u(10), fontWeight: 600 }}>Payment details</T>
              <T style={{ fontSize: u(9.5), color: MUTED }}>{view.paymentDetails}</T>
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: u(24),
            }}
          >
            <T style={{ flex: 1, fontSize: u(8.5), color: MUTED, lineHeight: 1.45 }}>
              {businessLine(view)}
            </T>
            {view.show.signature && <Signature ctx={ctx} color={MUTED} ink={INK} />}
          </View>
        </View>
      </View>
    </Page>
  )
}

function Signature({
  ctx,
  color,
  ink,
  italic,
}: {
  ctx: Ctx
  color: string
  ink: string
  italic?: boolean
}) {
  return (
    <T
      style={{
        width: ctx.u(130),
        borderTopWidth: 1,
        borderColor: ink,
        paddingTop: ctx.u(6),
        fontSize: ctx.u(8.5),
        color,
        fontStyle: italic ? 'italic' : 'normal',
      }}
    >
      Authorized signature
    </T>
  )
}

/* ---------- Minimal ---------- */

function Minimal(ctx: Ctx) {
  const { view, u, text, figures } = ctx
  const INK = '#141414'
  const MUTED = '#6B6B6B'
  const RULE = '#E8E8E5'
  const b = view.business
  const label: Style = {
    fontFamily: figures,
    fontSize: u(8),
    fontWeight: 500,
    letterSpacing: u(0.8),
    color: MUTED,
  }
  const num: Style = { fontFamily: figures }

  const party = (title: string, lines: string[]) => {
    const [first, ...rest] = lines
    return (
      <View style={{ flex: 1, gap: u(3) }}>
        <T style={label}>{title}</T>
        <T style={{ fontSize: u(11), fontWeight: 500 }}>{first ?? '—'}</T>
        {rest.map((line) => (
          <T key={line} style={{ fontSize: u(10), color: MUTED }}>
            {line}
          </T>
        ))}
      </View>
    )
  }

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{ fontFamily: text, color: INK, fontSize: u(10), lineHeight: 1.3, padding: u(32) }}
    >
      <View style={{ flexGrow: 1, gap: u(20) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(8) }}>
            {view.show.logo && b.logoUrl ? (
              <Image
                src={b.logoUrl}
                style={{ width: u(20), height: u(20), borderRadius: u(5), objectFit: 'contain' }}
              />
            ) : (
              <View
                style={{
                  width: u(20),
                  height: u(20),
                  borderRadius: u(5),
                  backgroundColor: view.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T style={{ ...num, color: 'white', fontSize: u(10), fontWeight: 600 }}>
                  {initials(b.name || '?').slice(0, 1)}
                </T>
              </View>
            )}
            <T style={{ fontSize: u(13), fontWeight: 600 }}>{b.name || 'Your business'}</T>
          </View>
          <View style={{ alignItems: 'flex-end', gap: u(4) }}>
            <T style={{ fontSize: u(22), fontWeight: 500, letterSpacing: u(-0.6), lineHeight: 1 }}>
              Invoice
            </T>
            <T style={{ ...num, fontSize: u(10), color: MUTED }}>{view.number}</T>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: u(16),
            paddingVertical: u(14),
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: RULE,
          }}
        >
          {[
            ['ISSUED', view.issued, 11],
            ['DUE', view.due, 11],
            ['AMOUNT DUE', view.total, 13],
          ].map(([l, v, size]) => (
            <View key={l as string} style={{ flex: 1, gap: u(5) }}>
              <T style={label}>{l}</T>
              <T style={{ ...num, fontSize: u(size as number), fontWeight: 500 }}>{v}</T>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: u(16) }}>
          {party(
            'FROM',
            pick<string>([
              b.name,
              b.email,
              b.address,
              view.show.taxId && b.taxId ? `Tax ID ${b.taxId}` : '',
            ]),
          )}
          {party(
            'BILL TO',
            pick<string>([
              view.client?.name ?? '—',
              view.client?.email,
              view.client?.address,
              view.show.taxId && view.client?.taxId ? `Tax ID ${view.client.taxId}` : '',
            ]),
          )}
        </View>

        <View>
          <View
            fixed
            style={{
              flexDirection: 'row',
              paddingVertical: u(6),
              borderBottomWidth: 1,
              borderColor: RULE,
              ...label,
            }}
          >
            <T style={{ flex: 1 }}>DESCRIPTION</T>
            <T style={{ width: u(44), textAlign: 'right' }}>QTY</T>
            <T style={{ width: u(84), textAlign: 'right' }}>RATE</T>
            <T style={{ width: u(84), textAlign: 'right' }}>AMOUNT</T>
          </View>
          {view.lines.map((line, i) => (
            <View
              key={line.id}
              wrap={false}
              style={{
                flexDirection: 'row',
                paddingVertical: u(9),
                borderBottomWidth: i < view.lines.length - 1 ? 1 : 0,
                borderColor: RULE,
              }}
            >
              <View style={{ flex: 1, paddingRight: u(12) }}>
                <T>{line.title || 'Untitled item'}</T>
                {line.description && (
                  <T style={{ fontSize: u(8.5), color: MUTED }}>{line.description}</T>
                )}
              </View>
              <T style={{ ...num, width: u(44), textAlign: 'right', color: MUTED }}>{line.qty}</T>
              <T style={{ ...num, width: u(84), textAlign: 'right', color: MUTED }}>{line.rate}</T>
              <T style={{ ...num, width: u(84), textAlign: 'right', fontWeight: 500 }}>
                {line.amount}
              </T>
            </View>
          ))}
        </View>

        <View wrap={false} style={{ alignSelf: 'flex-end', width: u(180), gap: u(6) }}>
          <TotalsRows ctx={ctx} labelStyle={{ color: MUTED }} valueStyle={num} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopWidth: 1,
              borderColor: INK,
              paddingTop: u(8),
            }}
          >
            <T style={{ fontSize: u(11), fontWeight: 600 }}>Total due</T>
            <T style={{ ...num, fontSize: u(13), fontWeight: 600 }}>{view.total}</T>
          </View>
        </View>

        <View style={{ flexGrow: 1 }} />

        {(view.notes || view.paymentDetails || view.show.signature) && (
          <View
            wrap={false}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: u(16),
              paddingTop: u(14),
              borderTopWidth: 1,
              borderColor: RULE,
            }}
          >
            {[
              ['NOTES', view.notes],
              ['PAYMENT', view.paymentDetails ?? ''],
            ].map(([l, v]) => (
              <View key={l} style={{ width: '47%', gap: u(4) }}>
                {v ? (
                  <>
                    <T style={label}>{l}</T>
                    <T style={{ fontSize: u(9), color: MUTED }}>{v}</T>
                  </>
                ) : null}
              </View>
            ))}
            {view.show.signature && (
              <View style={{ width: '100%', alignItems: 'flex-end', marginTop: u(8) }}>
                <Signature ctx={ctx} color={MUTED} ink={INK} />
              </View>
            )}
          </View>
        )}
      </View>
    </Page>
  )
}

/* ---------- Classic ---------- */

function Classic(ctx: Ctx) {
  const { view, u, text } = ctx
  const INK = '#1F1B16'
  const MUTED = '#7A7268'
  const RULE = '#E4DED3'
  const PAPER = '#FFFDF8'
  const b = view.business
  const italic: Style = { fontStyle: 'italic', color: MUTED }
  const letterhead = pick<string>([
    b.address.replace(/\n+/g, ', '),
    b.email,
    b.phone,
    b.website,
  ]).join(' · ')
  const clientLine = pick<string>([
    view.client?.address.replace(/\n+/g, ', '),
    view.client?.email,
    view.show.taxId && view.client?.taxId ? `Tax ID ${view.client.taxId}` : '',
  ]).join(' · ')
  const meta = pick<[string, string]>([
    ['No.', view.number],
    ['Issued', view.issued],
    ['Due', view.due],
    view.reference ? ['Ref.', view.reference] : null,
  ])

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{
        fontFamily: text,
        color: INK,
        fontSize: u(11),
        lineHeight: 1.3,
        backgroundColor: PAPER,
        paddingVertical: u(32),
        paddingHorizontal: u(36),
      }}
    >
      <View style={{ flexGrow: 1, gap: u(20) }}>
        <View style={{ alignItems: 'center', gap: u(6) }}>
          {view.show.logo && b.logoUrl && (
            <Image
              src={b.logoUrl}
              style={{ height: u(28), objectFit: 'contain', marginBottom: u(4) }}
            />
          )}
          <T
            style={{
              fontSize: u(15),
              fontWeight: 600,
              letterSpacing: u(3),
              textTransform: 'uppercase',
            }}
          >
            {b.name || 'Your business'}
          </T>
          {letterhead && (
            <T style={{ ...italic, fontSize: u(10), textAlign: 'center' }}>{letterhead}</T>
          )}
          {view.show.taxId && b.taxId && (
            <T style={{ fontSize: u(9.5), color: MUTED }}>Tax ID {b.taxId}</T>
          )}
        </View>

        <View style={{ gap: u(2) }}>
          <View style={{ height: u(2), backgroundColor: view.accent }} />
          <View style={{ height: u(1), backgroundColor: view.accent }} />
        </View>

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
        >
          <T
            style={{ fontSize: u(34), fontStyle: 'italic', letterSpacing: u(-0.5), lineHeight: 1 }}
          >
            Invoice
          </T>
          <View style={{ gap: u(3) }}>
            {meta.map(([l, v]) => (
              <View key={l} style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: u(8) }}>
                <T style={{ ...italic, fontSize: u(10) }}>{l}</T>
                <T style={{ fontSize: u(10.5) }}>{v}</T>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: u(3) }}>
          <T style={{ ...italic, fontSize: u(10) }}>Billed to</T>
          <T style={{ fontSize: u(13), fontWeight: 600 }}>{view.client?.name ?? '—'}</T>
          {clientLine && <T style={{ fontSize: u(10.5), color: MUTED }}>{clientLine}</T>}
        </View>

        <View style={{ borderTopWidth: 1, borderColor: INK }}>
          <View
            fixed
            style={{
              flexDirection: 'row',
              paddingVertical: u(7),
              borderBottomWidth: 1,
              borderColor: INK,
              ...italic,
              fontSize: u(9.5),
            }}
          >
            <T style={{ flex: 1 }}>Description</T>
            <T style={{ width: u(40), textAlign: 'right' }}>Qty</T>
            <T style={{ width: u(84), textAlign: 'right' }}>Rate</T>
            <T style={{ width: u(84), textAlign: 'right' }}>Amount</T>
          </View>
          {view.lines.map((line, i) => (
            <View
              key={line.id}
              wrap={false}
              style={{
                flexDirection: 'row',
                paddingVertical: u(9),
                borderBottomWidth: i < view.lines.length - 1 ? u(0.75) : 0,
                borderColor: RULE,
              }}
            >
              <View style={{ flex: 1, paddingRight: u(12) }}>
                <T>{line.title || 'Untitled item'}</T>
                {line.description && (
                  <T style={{ ...italic, fontSize: u(9.5) }}>{line.description}</T>
                )}
              </View>
              <T style={{ width: u(40), textAlign: 'right' }}>{line.qty}</T>
              <T style={{ width: u(84), textAlign: 'right' }}>{line.rate}</T>
              <T style={{ width: u(84), textAlign: 'right' }}>{line.amount}</T>
            </View>
          ))}
        </View>

        <View
          wrap={false}
          style={{ alignSelf: 'flex-end', width: u(190), gap: u(5), fontSize: u(10.5) }}
        >
          <TotalsRows ctx={ctx} labelStyle={italic} valueStyle={{}} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: u(8),
              borderTopWidth: u(1.5),
              borderBottomWidth: u(1.5),
              borderColor: view.accent,
            }}
          >
            <T style={{ fontSize: u(11.5), fontWeight: 600 }}>Amount due</T>
            <T style={{ fontSize: u(15), fontWeight: 600, color: view.accent }}>{view.total}</T>
          </View>
        </View>

        <View style={{ flexGrow: 1 }} />

        <View wrap={false} style={{ alignItems: 'center', gap: u(4), paddingTop: u(8) }}>
          <T style={{ fontSize: u(12), fontStyle: 'italic', textAlign: 'center' }}>
            {view.notes || 'Thank you for your business.'}
          </T>
          {view.paymentDetails && (
            <T style={{ fontSize: u(9.5), color: MUTED, textAlign: 'center' }}>
              {view.paymentDetails}
            </T>
          )}
          {view.show.signature && (
            <View style={{ marginTop: u(20) }}>
              <Signature ctx={ctx} color={MUTED} ink={INK} italic />
            </View>
          )}
        </View>
      </View>
    </Page>
  )
}

/* ---------- Studio ---------- */

function Studio(ctx: Ctx) {
  const { view, u, text, figures } = ctx
  const INK = '#16161A'
  const MUTED = '#74747C'
  const RAIL = '#F6F5F2'
  const RULE = '#EBEAE6'
  const b = view.business
  const label: Style = { fontFamily: figures, fontSize: u(8), letterSpacing: u(0.8), color: MUTED }
  const mono: Style = { fontFamily: figures }

  const block = (title: string, strong: string, lines: string[] = [], isMono = false) => (
    <View style={{ gap: u(3) }}>
      <T style={label}>{title}</T>
      <T style={{ fontSize: u(10), fontWeight: 600, ...(isMono ? mono : {}) }}>{strong}</T>
      {lines.map((line) => (
        <T key={line} style={{ fontSize: u(9), color: MUTED }}>
          {line}
        </T>
      ))}
    </View>
  )

  return (
    <Page
      size={PAPER_PT[view.paper].size}
      style={{ fontFamily: text, color: INK, fontSize: u(9), lineHeight: 1.3, flexDirection: 'row' }}
    >
      {/* The rail is fixed so it continues down every page. */}
      <View
        fixed
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: u(136),
          backgroundColor: RAIL,
        }}
      />
      <View style={{ width: u(136), paddingVertical: u(32), paddingHorizontal: u(20), gap: u(22) }}>
        {view.show.logo && b.logoUrl ? (
          <Image
            src={b.logoUrl}
            style={{
              width: u(28),
              height: u(28),
              borderRadius: u(14),
              objectFit: 'contain',
              backgroundColor: 'white',
            }}
          />
        ) : (
          <View
            style={{
              width: u(28),
              height: u(28),
              borderRadius: u(14),
              backgroundColor: view.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T style={{ color: 'white', fontSize: u(11), fontWeight: 700 }}>
              {initials(b.name || '?').toLowerCase()}
            </T>
          </View>
        )}
        {block(
          'FROM',
          b.name || 'Your business',
          pick<string>([
            b.email,
            b.address,
            b.phone,
            view.show.taxId && b.taxId ? `Tax ID ${b.taxId}` : '',
          ]),
        )}
        {block(
          'BILL TO',
          view.client?.name ?? '—',
          pick<string>([
            view.client?.email,
            view.client?.address,
            view.show.taxId && view.client?.taxId ? `Tax ID ${view.client.taxId}` : '',
          ]),
        )}
        {block('ISSUED', view.issued, [], true)}
        {block('DUE', view.due, [], true)}
        {view.reference ? block('REF.', view.reference, [], true) : null}
        {view.paymentDetails && (
          <View style={{ gap: u(3) }}>
            <T style={label}>PAYMENT</T>
            <T style={{ fontSize: u(9), color: MUTED }}>{view.paymentDetails}</T>
          </View>
        )}
      </View>

      <View
        style={{
          flex: 1,
          paddingTop: u(32),
          paddingHorizontal: u(24),
          paddingBottom: u(28),
          gap: u(26),
        }}
      >
        <View style={{ gap: u(6) }}>
          <T style={{ ...mono, fontSize: u(9), letterSpacing: u(0.5), color: MUTED }}>
            {view.number}
          </T>
          <T style={{ fontSize: u(30), fontWeight: 600, letterSpacing: u(-1.2), lineHeight: 1 }}>
            Invoice
          </T>
        </View>

        <View
          style={{ borderLeftWidth: u(2), borderColor: view.accent, paddingLeft: u(12), gap: u(4) }}
        >
          <T style={label}>{view.status === 'paid' ? 'PAID' : 'TOTAL DUE'}</T>
          <T
            style={{
              fontSize: u(22),
              fontWeight: 600,
              letterSpacing: u(-0.6),
              color: view.accent,
              lineHeight: 1,
            }}
          >
            {view.total}
          </T>
        </View>

        <View style={{ gap: u(14) }}>
          {view.lines.map((line) => (
            <View
              key={line.id}
              wrap={false}
              style={{ flexDirection: 'row', justifyContent: 'space-between', gap: u(8) }}
            >
              <View style={{ flex: 1, gap: u(2) }}>
                <T style={{ fontSize: u(10.5), fontWeight: 500 }}>
                  {line.title || 'Untitled item'}
                </T>
                {line.description && (
                  <T style={{ fontSize: u(8.5), color: MUTED }}>{line.description}</T>
                )}
                <T style={{ ...mono, fontSize: u(8.5), color: MUTED }}>
                  {line.qty} × {line.rate}
                </T>
              </View>
              <T style={{ ...mono, fontSize: u(10.5) }}>{line.amount}</T>
            </View>
          ))}
        </View>

        <View
          wrap={false}
          style={{
            borderTopWidth: 1,
            borderColor: RULE,
            paddingTop: u(14),
            gap: u(6),
            fontSize: u(9.5),
          }}
        >
          <TotalsRows ctx={ctx} labelStyle={{ color: MUTED }} valueStyle={mono} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: u(6) }}>
            <T style={{ fontSize: u(11), fontWeight: 600 }}>Total</T>
            <T style={{ ...mono, fontSize: u(11), fontWeight: 500 }}>
              {view.totalAmount} {view.currency}
            </T>
          </View>
        </View>

        <View style={{ flexGrow: 1 }} />
        {view.notes && <T style={{ fontSize: u(9), color: MUTED }}>{view.notes}</T>}
        {view.show.signature && <Signature ctx={ctx} color={MUTED} ink={INK} />}
      </View>
    </Page>
  )
}
