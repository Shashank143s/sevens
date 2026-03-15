// https://nuxt.com/docs/api/configuration/nuxt-config
// Runtime config: https://nuxt.com/docs/4.x/api/composables/use-runtime-config
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const clientVueDir = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-google-auth'],
  css: ['~/assets/css/main.css'],
  // Define runtime config here; access with useRuntimeConfig().public in app. Localhost-only defaults for dev.
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      socketServer: process.env.NUXT_PUBLIC_SOCKET_SERVER || 'http://localhost:8000',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
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
      title: 'Sevens',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
    },
  },
})
