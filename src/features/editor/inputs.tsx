import { useState, type InputHTMLAttributes } from 'react'
import { minorToDecimal, parseMoney } from '@/domain/money'

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

/**
 * Money input in minor units. Shows the formatted amount (`$4,800.00`);
 * while focused it shows a plain decimal (`4800.00`) to edit. Commits on
 * every valid keystroke so totals update live; an invalid value reverts on blur.
 */
export function MoneyInput({
  value,
  currency,
  format,
  onValue,
  ...props
}: BaseProps & {
  value: number
  currency: string
  format: (minor: number) => string
  onValue: (minor: number) => void
}) {
  const [text, setText] = useState<string | null>(null)
  return (
    <input
      inputMode="decimal"
      autoComplete="off"
      {...props}
      value={text ?? format(value)}
      onFocus={(e) => {
        setText(value === 0 ? '' : minorToDecimal(value, currency))
        props.onFocus?.(e)
      }}
      onChange={(e) => {
        setText(e.target.value)
        const minor = parseMoney(e.target.value || '0', currency)
        if (minor !== null && minor >= 0) onValue(minor)
      }}
      onBlur={(e) => {
        setText(null)
        props.onBlur?.(e)
      }}
    />
  )
}

/** Decimal input for quantities and percentages; commits valid numbers ≥ 0 within `max` (empty is 0). */
export function DecimalInput({
  value,
  onValue,
  max = Number.MAX_SAFE_INTEGER,
  ...props
}: BaseProps & { value: number; onValue: (n: number) => void; max?: number }) {
  const [text, setText] = useState<string | null>(null)
  return (
    <input
      inputMode="decimal"
      autoComplete="off"
      {...props}
      value={text ?? String(value)}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value.replace(',', '.') || '0')
        if (Number.isFinite(n) && n >= 0 && n <= max) onValue(n)
      }}
      onBlur={(e) => {
        setText(null)
        props.onBlur?.(e)
      }}
    />
  )
}
