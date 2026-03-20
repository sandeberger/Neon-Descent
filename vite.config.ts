import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
    alias: {
      '@core':     resolve(__dirname, 'src/core'),
      '@input':    resolve(__dirname, 'src/input'),
      '@world':    resolve(__dirname, 'src/world'),
      '@entities': resolve(__dirname, 'src/entities'),
      '@systems':  resolve(__dirname, 'src/systems'),
      '@render':   resolve(__dirname, 'src/rendering'),
      '@audio':    resolve(__dirname, 'src/audio'),
      '@ui':       resolve(__dirname, 'src/ui'),
      '@data':     resolve(__dirname, 'src/data'),
      '@utils':    resolve(__dirname, 'src/utils'),
      '@vfx':      resolve(__dirname, 'src/vfx'),
      '@states':   resolve(__dirname, 'src/states'),
      '@save':     resolve(__dirname, 'src/save'),
      '@meta':     resolve(__dirname, 'src/meta'),
      '@analytics': resolve(__dirname, 'src/analytics'),
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'NEON DESCENT',
        short_name: 'NEON DESCENT',
        description: 'Vertical action-roguelite',
        start_url: '/',
        display: 'fullscreen',
        orientation: 'portrait',
        theme_color: '#0a0a1a',
        background_color: '#0a0a1a',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache audio assets with CacheFirst
            urlPattern: /\.(?:webm|ogg|mp3|wav)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
