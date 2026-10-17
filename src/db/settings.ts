import { db } from './db'
import { defaultSettings } from './defaults'
import type { AppSettings } from './types'

export type SettingsPatch = Partial<Omit<AppSettings, 'key'>>

/** Stored settings, or the defaults when nothing has been saved yet. */
export async function getSettings(): Promise<AppSettings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

export async function updateSettings(patch: SettingsPatch): Promise<AppSettings> {
  return db.transaction('rw', db.settings, async () => {
    const next = { ...(await getSettings()), ...patch, key: 'app' as const }
    await db.settings.put(next)
    return next
  })
}
