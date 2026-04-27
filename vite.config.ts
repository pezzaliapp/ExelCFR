import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base = '/ExelCFR/' so the app works when deployed under github.io/<user>/ExelCFR/
export default defineConfig({
  base: '/ExelCFR/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'ExelCFR — CERCA.VERT tra listini',
        short_name: 'ExelCFR',
        description:
          'Confronta e unisci listini Excel/CSV con CERCA.VERT, direttamente nel browser. Nessun dato esce dal tuo dispositivo.',
        theme_color: '#0f766e',
        background_color: '#0b1020',
        display: 'standalone',
        start_url: './',
        scope: './',
        lang: 'it',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
