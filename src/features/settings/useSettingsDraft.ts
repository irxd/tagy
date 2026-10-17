import { useState } from 'react'
import { useAutosave } from '@/app/useAutosave'
import { useSettings } from '@/db/hooks'
import { updateSettings, type SettingsPatch } from '@/db/settings'
import type { AppSettings, Business } from '@/db/types'

/**
 * Settings for editing: the stored record with this session's edits on top.
 * Inputs read the merged draft, so typing never waits on (or fights) the live
 * query; edits autosave after a short pause. Clear all data remounts the page,
 * which drops the local edits.
 */
export function useSettingsDraft() {
  const stored = useSettings()
  const [edits, setEdits] = useState<SettingsPatch>({})
  const { queue } = useAutosave<SettingsPatch>(updateSettings)

  const draft: AppSettings | undefined = stored && {
    ...stored,
    ...edits,
    // Only edited business fields override; the logo always comes from the store.
    business: { ...stored.business, ...edits.business },
  }

  function set(patch: Omit<SettingsPatch, 'business'>) {
    setEdits((e) => ({ ...e, ...patch }))
    queue(patch)
  }

  function setBusiness(patch: Partial<Omit<Business, 'logoBlobId'>>) {
    const business = { ...edits.business, ...patch }
    setEdits((e) => ({ ...e, business: { ...e.business, ...patch } }))
    // The autosave queue merges shallowly, so send every edited business field.
    queue({ business })
  }

  return { draft, set, setBusiness }
}

export type SettingsDraft = ReturnType<typeof useSettingsDraft>
