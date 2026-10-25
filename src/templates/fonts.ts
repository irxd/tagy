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
import type { NamedFont, TemplateFont, TemplateId } from '@/db/types'

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

/** Each template's own type, from tagy.pen: text and figures. */
export const TEMPLATE_FONTS: Record<TemplateId, { text: NamedFont; figures: NamedFont }> = {
  minimal: { text: 'geist', figures: 'geist' },
  classic: { text: 'newsreader', figures: 'newsreader' },
  bold: { text: 'inter-tight', figures: 'inter-tight' },
  studio: { text: 'dm-sans', figures: 'dm-mono' },
}

/** Font ids for a template under the Font setting; HTML and PDF share this rule. */
export function fontIds(template: TemplateId, setting: TemplateFont) {
  return setting === 'template' ? TEMPLATE_FONTS[template] : { text: setting, figures: setting }
}

/**
 * Type for a template under the Font setting: Template keeps the template's
 * own type; a named font replaces both the text and the figures.
 */
export function templateFonts(template: TemplateId, setting: TemplateFont) {
  const { text, figures } = fontIds(template, setting)
  return { text: FONTS[text], figures: FONTS[figures] }
}
