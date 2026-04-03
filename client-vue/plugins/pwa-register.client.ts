import { registerSW } from 'virtual:pwa-register'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('[pwa] Service worker registration failed:', error)
    },
  })
})
