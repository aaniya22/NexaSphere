import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Aliases for next/image and next/dynamic shims used in the website source
  resolve: {
    alias: {
      'next/image': '/src/shared/next-image.jsx',
      'next/dynamic': '/src/shared/next-dynamic.jsx',
    },
  },
  // Supports Vercel (/) and GitHub Pages (/NexaSphere/) via env var
  base: process.env.VITE_CDN_URL || process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || 'nexasphere',
      project: process.env.SENTRY_PROJECT || 'javascript-react',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Don't fail build if Sentry token is not set
      silent: true,
    }),
    process.env.ANALYZE === 'true' &&
      visualizer({
        filename: 'bundle-report.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    VitePWA({
      disable: process.env.DISABLE_PWA === 'true',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'NexaSphere — Connecting GL Bajaj Tech Ecosystem',
        short_name: 'NexaSphere',
        description: 'The premier tech community of GL Bajaj Group of Institutions.',
        theme_color: '#CC1111',
        background_color: '#0A0A0A',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        inlineWorkboxRuntime: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        // Increase limit to 4MB to accommodate TensorFlow.js and other large vendor chunks
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  optimizeDeps: {
    include: ['idb-keyval', 'dompurify'],
  },
  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      // Ensure all deps are bundled (not externalized)
      external: [],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            if (id.includes('@tensorflow/tfjs')) {
              return 'vendor-tensorflow';
            }
            if (id.includes('@fullcalendar')) {
              return 'vendor-fullcalendar';
            }
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) {
              return 'vendor-pdf';
            }
            if (
              id.includes('i18next') ||
              id.includes('react-i18next') ||
              id.includes('i18next-browser-languagedetector')
            ) {
              return 'vendor-i18n';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:8787',
      '/healthz': 'http://localhost:8787',
    },
  },
});
