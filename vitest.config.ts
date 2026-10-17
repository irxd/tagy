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
      coverage: {
        provider: 'v8',
        include: ['src/domain/**', 'src/db/**'],
        exclude: ['**/*.test.ts', 'src/db/hooks.ts', 'src/db/types.ts'],
        // Money and status logic carry the most risk: keep it fully covered.
        thresholds: {
          'src/domain/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
        },
      },
    },
  }),
)
