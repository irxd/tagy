import dmMono400 from '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff?url'
import dmMono500 from '@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff?url'
import dmSans400 from '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff?url'
import dmSans500 from '@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff?url'
import dmSans600 from '@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff?url'
import dmSans700 from '@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff?url'
import geistMono400 from '@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff?url'
import geistMono500 from '@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff?url'
import geistMono600 from '@fontsource/geist-mono/files/geist-mono-latin-600-normal.woff?url'
import geist400 from '@fontsource/geist/files/geist-latin-400-normal.woff?url'
import geist500 from '@fontsource/geist/files/geist-latin-500-normal.woff?url'
import geist600 from '@fontsource/geist/files/geist-latin-600-normal.woff?url'
import interTight400 from '@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff?url'
import interTight500 from '@fontsource/inter-tight/files/inter-tight-latin-500-normal.woff?url'
import interTight600 from '@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff?url'
import interTight700 from '@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff?url'
import newsreader400i from '@fontsource/newsreader/files/newsreader-latin-400-italic.woff?url'
import newsreader400 from '@fontsource/newsreader/files/newsreader-latin-400-normal.woff?url'
import newsreader600 from '@fontsource/newsreader/files/newsreader-latin-600-normal.woff?url'
import { Font } from '@react-pdf/renderer'
import type { TemplateFont, TemplateId } from '@/db/types'

/*
 * Static Latin cuts of the template fonts, embedded in every PDF. React-PDF
 * can't use the variable fonts the HTML templates load, so these mirror
 * them weight by weight. They're only fetched when a PDF is made.
 */

let registered = false

export function registerFonts() {
  if (registered) return
  registered = true
  const family = (
    name: string,
    fonts: { src: string; fontWeight?: number; fontStyle?: 'italic' }[],
  ) => Font.register({ family: name, fonts })

  family('Inter Tight', [
    { src: interTight400, fontWeight: 400 },
    { src: interTight500, fontWeight: 500 },
    { src: interTight600, fontWeight: 600 },
    { src: interTight700, fontWeight: 700 },
  ])
  family('Geist', [
    { src: geist400, fontWeight: 400 },
    { src: geist500, fontWeight: 500 },
    { src: geist600, fontWeight: 600 },
    { src: geist600, fontWeight: 700 },
  ])
  family('Geist Mono', [
    { src: geistMono400, fontWeight: 400 },
    { src: geistMono500, fontWeight: 500 },
    { src: geistMono600, fontWeight: 600 },
    { src: geistMono600, fontWeight: 700 },
  ])
  family('Newsreader', [
    { src: newsreader400, fontWeight: 400 },
    { src: newsreader400i, fontWeight: 400, fontStyle: 'italic' },
    { src: newsreader600, fontWeight: 500 },
    { src: newsreader600, fontWeight: 600 },
    { src: newsreader600, fontWeight: 700 },
  ])
  family('DM Sans', [
    { src: dmSans400, fontWeight: 400 },
    { src: dmSans500, fontWeight: 500 },
    { src: dmSans600, fontWeight: 600 },
    { src: dmSans700, fontWeight: 700 },
  ])
  family('DM Mono', [
    { src: dmMono400, fontWeight: 400 },
    { src: dmMono500, fontWeight: 500 },
    { src: dmMono500, fontWeight: 600 },
    { src: dmMono500, fontWeight: 700 },
  ])
  // Keep words whole; React-PDF hyphenates by default.
  Font.registerHyphenationCallback((word) => [word])
}

const OWN: Record<TemplateId, { text: string; figures: string }> = {
  minimal: { text: 'Geist', figures: 'Geist' },
  classic: { text: 'Newsreader', figures: 'Newsreader' },
  bold: { text: 'Inter Tight', figures: 'Inter Tight' },
  studio: { text: 'DM Sans', figures: 'DM Mono' },
}

/** Same rule as the HTML templates (templates/fonts.ts). */
export function pdfFonts(template: TemplateId, setting: TemplateFont) {
  const own = OWN[template]
  if (setting === 'serif') return { text: 'Newsreader', figures: own.figures }
  if (setting === 'mono') return { text: 'Geist Mono', figures: 'Geist Mono' }
  return own
}
