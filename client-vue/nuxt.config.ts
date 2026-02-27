// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const clientVueDir = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
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
