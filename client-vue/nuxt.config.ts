// https://nuxt.com/docs/api/configuration/nuxt-config
// Runtime config: https://nuxt.com/docs/4.x/api/composables/use-runtime-config
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const clientVueDir = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/sw.js': {
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    },
    '/manifest.webmanifest': {
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    },
    '/_nuxt/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
    },
  },
  // Define runtime config here; access with useRuntimeConfig().public in app. Localhost-only defaults for dev.
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      socketServer: process.env.NUXT_PUBLIC_SOCKET_SERVER || 'http://localhost:8000',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://sevensroyale.com',
      appSource: process.env.NUXT_PUBLIC_APP_SOURCE || 'web',
      uiDensity: process.env.NUXT_PUBLIC_UI_DENSITY || 'cozy',
      admobEnabled: process.env.NUXT_PUBLIC_ADMOB_ENABLED || 'true',
      admobTestMode: process.env.NUXT_PUBLIC_ADMOB_TEST_MODE || 'true',
      admobBannerAdUnitId: process.env.NUXT_PUBLIC_ADMOB_BANNER_AD_UNIT_ID || '',
      admobInterstitialAdUnitId: process.env.NUXT_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID || '',
      admobRewardedAdUnitId: process.env.NUXT_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID || '',
    },
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
      screenshots: [
        {
          src: '/screenshots/home.png',
          sizes: '824x1786',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Sevens Royale home screen',
        },
        {
          src: '/screenshots/lobby.png',
          sizes: '826x1788',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Lobby with live multiplayer rooms',
        },
        {
          src: '/screenshots/join-game.png',
          sizes: '822x1786',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Join table room flow',
        },
        {
          src: '/screenshots/game-table-start.png',
          sizes: '832x1784',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Game table at the start of a match',
        },
        {
          src: '/screenshots/game-table-pass.png',
          sizes: '830x1786',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Game table pass state',
        },
        {
          src: '/screenshots/game-complete.png',
          sizes: '828x1790',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Winner overlay after match completion',
        },
        {
          src: '/screenshots/game-xp-level.png',
          sizes: '804x1456',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'XP and level progression screen',
        },
        {
          src: '/screenshots/leaderboard.png',
          sizes: '830x1790',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Leaderboard with player rankings',
        },
        {
          src: '/screenshots/recent-games.png',
          sizes: '824x1786',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Recent games history screen',
        },
        {
          src: '/screenshots/accounts.png',
          sizes: '826x1790',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Player account overview',
        },
        {
          src: '/screenshots/game-instructions.png',
          sizes: '824x1784',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'How to play instructions page',
        },
        {
          src: '/screenshots/download.png',
          sizes: '830x1790',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Download page for the Android app',
        },
        {
          src: '/screenshots/contact-us.png',
          sizes: '824x1786',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Contact us and support page',
        },
      ],
    },
    workbox: {
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
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
