import { db } from './db'
import { defaultSettings } from './defaults'
import type { AppSettings, Business } from './types'

/** Top-level fields replace; `business` merges field by field. */
export type SettingsPatch = Partial<Omit<AppSettings, 'key' | 'business'>> & {
  business?: Partial<Business>
}

/** Stored settings, or the defaults when nothing has been saved yet. */
export async function getSettings(): Promise<AppSettings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

/**
 * Merges a patch into the stored record in one transaction. Business fields
 * merge individually, so a profile edit can't clobber the logo reference
 * written separately by saveLogo.
 */
export async function updateSettings(patch: SettingsPatch): Promise<AppSettings> {
  return db.transaction('rw', db.settings, async () => {
    const current = await getSettings()
    const next: AppSettings = {
      ...current,
      ...patch,
      business: { ...current.business, ...patch.business },
      key: 'app',
    }
    await db.settings.put(next)
    return next
  })
}
