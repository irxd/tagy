import '@fontsource-variable/geist-mono'
import '@fontsource-variable/inter-tight'
import '@fontsource-variable/newsreader'
import type { TemplateFont } from '@/db/types'

export const FONTS = {
  interTight: "'Inter Tight Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  newsreader: "'Newsreader Variable', Georgia, 'Times New Roman', serif",
  geistMono: "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
}

/**
 * The Font setting (Sans / Serif / Mono) swaps a template's type: Sans keeps
 * the template's own sans, Serif and Mono replace it.
 */
export function fontFor(setting: TemplateFont, ownSans: string): string {
  return setting === 'serif' ? FONTS.newsreader : setting === 'mono' ? FONTS.geistMono : ownSans
}
