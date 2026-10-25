import type { BusinessDetails } from '@/db/types'
import { useEditor } from './useEditor'

const BUSINESS_KEYS = ['name', 'email', 'phone', 'website', 'address', 'taxId'] as const

/**
 * The business details this invoice prints: Settings', with any edited on
 * this invoice alone on top (and, once sent, its frozen copy). Edits apply to
 * this invoice only; `reset` goes back to Settings.
 */
export function useBusinessDetails() {
  const { invoice, settings, set } = useEditor()
  const fromSettings = Object.fromEntries(
    BUSINESS_KEYS.map((k) => [k, settings.business[k]]),
  ) as BusinessDetails
  const details = { ...fromSettings, ...invoice.businessOverride, ...invoice.businessSnapshot }
  return {
    details,
    own: invoice.businessOverride !== null,
    change(patch: Partial<BusinessDetails>) {
      set({
        businessOverride: { ...invoice.businessOverride, ...patch },
        // A sent invoice prints its frozen copy, so edit that too.
        ...(invoice.businessSnapshot && {
          businessSnapshot: { ...invoice.businessSnapshot, ...patch },
        }),
      })
    },
    reset() {
      set({
        businessOverride: null,
        ...(invoice.businessSnapshot && { businessSnapshot: fromSettings }),
      })
    },
  }
}
