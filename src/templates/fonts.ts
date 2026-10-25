import '@fontsource-variable/dm-sans'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/inter-tight'
import '@fontsource-variable/newsreader'
import '@fontsource-variable/newsreader/wght-italic.css'
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
import type { NamedFont, TemplateFonts, TemplateId } from '@/db/types'

export type FontRole = keyof TemplateFonts

export const FONTS: Record<NamedFont, string> = {
  geist: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  'inter-tight': "'Inter Tight Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  'dm-sans': "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif",
  newsreader: "'Newsreader Variable', Georgia, 'Times New Roman', serif",
  'source-serif-4': "'Source Serif 4 Variable', Georgia, 'Times New Roman', serif",
  'instrument-serif': "'Instrument Serif', Georgia, 'Times New Roman', serif",
  'geist-mono': "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
  'dm-mono': "'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  'space-mono': "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

/** The Font setting's choices, in picker order. */
export const FONT_LABELS: Record<NamedFont, string> = {
  geist: 'Geist',
  'inter-tight': 'Inter Tight',
  'dm-sans': 'DM Sans',
  newsreader: 'Newsreader',
  'source-serif-4': 'Source Serif 4',
  'instrument-serif': 'Instrument Serif',
  'geist-mono': 'Geist Mono',
  'dm-mono': 'DM Mono',
  'space-mono': 'Space Mono',
}

/**
 * Width of the word "INVOICE" in em, at weight 400, measured in the browser.
 * Templates with a title too big to wrap size it from this so any heading
 * font fits the page.
 */
export const INVOICE_EM: Record<NamedFont, number> = {
  geist: 3.93,
  'inter-tight': 3.68,
  'dm-sans': 3.86,
  newsreader: 4.2,
  'source-serif-4': 4.17,
  'instrument-serif': 2.93,
  'geist-mono': 4.2,
  'dm-mono': 4.2,
  'space-mono': 4.28,
}

/** Size for an "INVOICE" title: `max` px as drawn, smaller if that's wider than `width` px. */
export function fitInvoiceTitle(font: NamedFont, max: number, width: number) {
  return Math.min(max, Math.floor(width / INVOICE_EM[font]))
}

/** Each template's own type, from tagy.pen: headings and body. */
export const TEMPLATE_FONTS: Record<TemplateId, Record<FontRole, NamedFont>> = {
  minimal: { heading: 'geist', body: 'geist' },
  classic: { heading: 'source-serif-4', body: 'source-serif-4' },
  bold: { heading: 'inter-tight', body: 'inter-tight' },
  studio: { heading: 'instrument-serif', body: 'space-mono' },
}

/** Font ids for a template under the Font setting; HTML and PDF share this rule. */
export function fontIds(template: TemplateId, fonts: TemplateFonts): Record<FontRole, NamedFont> {
  const own = TEMPLATE_FONTS[template]
  const pick = (role: FontRole) => {
    const font = fonts[role]
    return font === 'template' ? own[role] : font
  }
  return { heading: pick('heading'), body: pick('body') }
}

/**
 * Type for a template under the Font setting. Each role keeps the template's
 * own font on Template, or uses the named font; figures follow the body.
 */
export function templateFonts(template: TemplateId, fonts: TemplateFonts) {
  const { heading, body } = fontIds(template, fonts)
  return { heading: FONTS[heading], body: FONTS[body] }
}
