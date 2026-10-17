import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'node',
      // In-memory IndexedDB so Dexie runs under Node.
      setupFiles: ['fake-indexeddb/auto'],
    },
  }),
)
