// https://nuxt.com/docs/api/configuration/nuxt-config
// Runtime config: https://nuxt.com/docs/4.x/api/composables/use-runtime-config
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const clientVueDir = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-google-auth', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  // Define runtime config here; access with useRuntimeConfig().public in app. Localhost-only defaults for dev.
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      socketServer: process.env.NUXT_PUBLIC_SOCKET_SERVER || 'http://localhost:8000',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://sevensroyale.com',
    },
  },
  googleAuth: {
    clientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID,
    autoLoadScript: true,
    promptOneTap: false,
    enableServerVerify: false,
  },
  vite: {
    resolve: {
      alias: {
        '@shared/types': resolve(clientVueDir, '../shared/types.ts'),
        '@server/game': resolve(clientVueDir, '../server/src/game.ts'),
      },
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
  app: {
    head: {
      title: 'Sevens Royale',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Sevens Royale' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        {
          name: 'description',
          content: 'Play Sevens online, create rooms, invite friends, and jump back into the table from your home screen.',
        },
        { property: 'og:site_name', content: 'Sevens Royale' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#d1a728' },
        { rel: 'apple-touch-icon', href: '/pwa-192.png' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    includeAssets: ['favicon.svg', 'safari-pinned-tab.svg', 'pwa-192.png', 'pwa-512.png'],
    manifest: {
      id: '/',
      name: 'Sevens Royale',
      short_name: 'Sevens',
      description: 'A mobile-friendly Sevens card game with live multiplayer rooms and quick rejoin support.',
      theme_color: '#0f172a',
      background_color: '#020617',
      display: 'fullscreen',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      categories: ['games', 'entertainment'],
      icons: [
        {
          src: '/pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/pwa-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      navigateFallback: null,
      runtimeCaching: [
        {
          urlPattern: /^https?:.*(?:\/_nuxt\/|\/.*\.(?:png|svg|webp|jpg|jpeg|gif|ico))$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'sevens-static-assets',
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
    },
  },
})
