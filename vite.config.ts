import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Offline after the first visit: the service worker precaches the app
    // shell, fonts and the PDF engine. Updates wait for the user (prompt),
    // so a new version never reloads the page mid-edit.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Tagy — free invoice maker',
        short_name: 'Tagy',
        description: 'Free invoice maker. No account — your invoices stay in this browser.',
        theme_color: '#111214',
        background_color: '#ECEEF1',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // The PDF engine chunk is ~1.2 MB; keep it available offline.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // The PDF engine is only imported on demand; pre-bundle it so the first
  // download in development doesn't trigger a dependency re-optimise reload.
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
