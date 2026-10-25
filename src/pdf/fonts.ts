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
import instrumentSerif400i from '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff?url'
import instrumentSerif400 from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff?url'
import interTight400 from '@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff?url'
import interTight500 from '@fontsource/inter-tight/files/inter-tight-latin-500-normal.woff?url'
import interTight600 from '@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff?url'
import interTight700 from '@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff?url'
import newsreader400i from '@fontsource/newsreader/files/newsreader-latin-400-italic.woff?url'
import newsreader400 from '@fontsource/newsreader/files/newsreader-latin-400-normal.woff?url'
import newsreader600 from '@fontsource/newsreader/files/newsreader-latin-600-normal.woff?url'
import sourceSerif400i from '@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff?url'
import sourceSerif400 from '@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff?url'
import sourceSerif600 from '@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff?url'
import sourceSerif700 from '@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff?url'
import spaceMono400 from '@fontsource/space-mono/files/space-mono-latin-400-normal.woff?url'
import spaceMono700 from '@fontsource/space-mono/files/space-mono-latin-700-normal.woff?url'
import { Font } from '@react-pdf/renderer'
import type { NamedFont, TemplateFonts, TemplateId } from '@/db/types'
import { FONT_LABELS, fontIds } from '@/templates/fonts'

/*
 * Static Latin cuts of the template fonts, embedded in every PDF. React-PDF
 * can't use the variable fonts the HTML templates load, so these mirror
 * them weight by weight. They're only fetched when a PDF is made.
 */

interface Cuts {
  /** Weight → file; weights 400–700 without a file use the nearest cut. */
  weights: Partial<Record<400 | 500 | 600 | 700, string>>
  italic?: string
}

const CUTS: Record<NamedFont, Cuts> = {
  geist: { weights: { 400: geist400, 500: geist500, 600: geist600 } },
  'inter-tight': {
    weights: { 400: interTight400, 500: interTight500, 600: interTight600, 700: interTight700 },
  },
  'dm-sans': { weights: { 400: dmSans400, 500: dmSans500, 600: dmSans600, 700: dmSans700 } },
  newsreader: { weights: { 400: newsreader400, 600: newsreader600 }, italic: newsreader400i },
  'source-serif-4': {
    weights: { 400: sourceSerif400, 600: sourceSerif600, 700: sourceSerif700 },
    italic: sourceSerif400i,
  },
  'instrument-serif': { weights: { 400: instrumentSerif400 }, italic: instrumentSerif400i },
  'geist-mono': { weights: { 400: geistMono400, 500: geistMono500, 600: geistMono600 } },
  'dm-mono': { weights: { 400: dmMono400, 500: dmMono500 } },
  'space-mono': { weights: { 400: spaceMono400, 700: spaceMono700 } },
}

/** The file for a weight: its own cut, else the nearest, the heavier on a tie. */
function nearest(weights: Cuts['weights'], weight: number) {
  const [, src] = Object.entries(weights).sort(
    ([a], [b]) => Math.abs(+a - weight) - Math.abs(+b - weight) || +b - +a,
  )[0]!
  return src!
}

let registered = false

export function registerFonts() {
  if (registered) return
  registered = true
  for (const id of Object.keys(CUTS) as NamedFont[]) {
    const { weights, italic } = CUTS[id]
    Font.register({
      family: FONT_LABELS[id],
      fonts: [
        ...[400, 500, 600, 700].map((w) => ({ src: nearest(weights, w), fontWeight: w })),
        // Fonts without an italic cut use the upright one rather than fail.
        { src: italic ?? nearest(weights, 400), fontWeight: 400, fontStyle: 'italic' as const },
      ],
    })
  }
  // Keep words whole; React-PDF hyphenates by default.
  Font.registerHyphenationCallback((word) => [word])
}

/** Same rule as the HTML templates (templates/fonts.ts). */
export function pdfFonts(template: TemplateId, fonts: TemplateFonts) {
  const { heading, body } = fontIds(template, fonts)
  return { heading: FONT_LABELS[heading], body: FONT_LABELS[body] }
}
