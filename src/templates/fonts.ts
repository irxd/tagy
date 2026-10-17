import '@fontsource-variable/dm-sans'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/inter-tight'
import '@fontsource-variable/newsreader'
import '@fontsource-variable/newsreader/wght-italic.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import type { TemplateFont, TemplateId } from '@/db/types'

export const FONTS = {
  geist: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  geistMono: "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
  interTight: "'Inter Tight Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  newsreader: "'Newsreader Variable', Georgia, 'Times New Roman', serif",
  dmSans: "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif",
  dmMono: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

/** Each template's own type, from tagy.pen: text and figures. */
const TEMPLATE_FONTS: Record<TemplateId, { text: string; figures: string }> = {
  minimal: { text: FONTS.geist, figures: FONTS.geistMono },
  classic: { text: FONTS.newsreader, figures: FONTS.newsreader },
  bold: { text: FONTS.interTight, figures: FONTS.interTight },
  studio: { text: FONTS.dmSans, figures: FONTS.dmMono },
}

/**
 * Type for a template under the Font setting: Sans keeps the template's own
 * type (Classic stays a serif); Serif and Mono replace the text face and
 * keep the template's figures.
 */
export function templateFonts(template: TemplateId, setting: TemplateFont) {
  const own = TEMPLATE_FONTS[template]
  if (setting === 'serif') return { text: FONTS.newsreader, figures: own.figures }
  if (setting === 'mono') return { text: FONTS.geistMono, figures: FONTS.geistMono }
  return own
}
