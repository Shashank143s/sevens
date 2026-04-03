export default defineNuxtPlugin(async () => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    } catch (error) {
      console.error('[pwa] Explicit service worker registration failed:', error)
    }
  }, { once: true })
})
