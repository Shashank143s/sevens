import { Capacitor } from '@capacitor/core'
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in'

let initialized = false

export default defineNuxtPlugin(async () => {
  if (!Capacitor.isNativePlatform()) return
  if (initialized) return

  const config = useRuntimeConfig()
  const clientId = config.public.googleClientId

  if (!clientId) {
    console.warn('[google-sign-in] Missing public google client ID')
    return
  }

  try {
    await GoogleSignIn.initialize({ clientId })
    initialized = true
  } catch (error) {
    console.error('[google-sign-in] Failed to initialize native Google Sign-In:', error)
  }
})
