/**
 * Two-letter initials for avatars: `Northwind Studio` → `NS`,
 * `Harbor & Field` → `HF`. Words that don't start with a letter or digit
 * (`&`, `—`) are skipped.
 */
export function initials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
  if (words.length === 0) return '?'
  const letters = words.length > 1 ? [words[0]![0], words[1]![0]] : [...words[0]!.slice(0, 2)]
  return letters.join('').toUpperCase()
}
