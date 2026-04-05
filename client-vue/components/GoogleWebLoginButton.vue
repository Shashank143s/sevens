<script setup lang="ts">
type GoogleButtonOptions = {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  width?: number
  logo_alignment?: 'left' | 'center'
}

type GoogleCredentialResponse = {
  credential?: string
}

type GoogleTokenClaims = Record<string, unknown>

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string
      callback: (response: GoogleCredentialResponse) => void
    }) => void
    renderButton: (element: HTMLElement, options: GoogleButtonOptions & { width?: number }) => void
  }
}

const props = withDefaults(defineProps<{
  options?: GoogleButtonOptions
  minWidth?: number
  maxWidth?: number
}>(), {
  options: () => ({
    theme: 'filled_blue',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
  }),
  minWidth: 200,
  maxWidth: 400,
})

const emit = defineEmits<{
  success: [payload: { credential: string; claims: GoogleTokenClaims }]
  error: [error: unknown]
}>()

const root = ref<HTMLElement | null>(null)
const config = useRuntimeConfig()
const clientId = config.public.googleClientId
let resizeObserver: ResizeObserver | null = null

function decodeJwtPayload<T>(token: string): T | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
    return JSON.parse(atob(padded)) as T
  } catch {
    return null
  }
}

function getGoogleAccounts(): GoogleAccounts | null {
  return (window as typeof window & { google?: { accounts?: GoogleAccounts } }).google?.accounts ?? null
}

let scriptPromise: Promise<void> | null = null
let initializedClientId: string | null = null
let credentialHandler: ((response: GoogleCredentialResponse) => void) | null = null

function ensureGoogleScript() {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-sevens-google-gis="1"]')
    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google GIS script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.sevensGoogleGis = '1'
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load Google GIS script')), { once: true })
    document.head.appendChild(script)
  })

  return scriptPromise
}

function emitCredential(response: GoogleCredentialResponse) {
  credentialHandler?.(response)
}

function renderButton() {
  const googleAccounts = getGoogleAccounts()
  if (!googleAccounts || !root.value) return

  const containerWidth = root.value.clientWidth || props.minWidth
  const width = typeof props.options.width === 'number'
    ? props.options.width
    : Math.min(Math.max(containerWidth, props.minWidth), props.maxWidth)

  root.value.innerHTML = ''
  googleAccounts.id.renderButton(root.value, {
    ...props.options,
    width,
  })
}

function bindCredentialHandler() {
  credentialHandler = (response) => {
    if (!response.credential) {
      emit('error', new Error('Google sign-in did not return a credential'))
      return
    }

    emit('success', {
      credential: response.credential,
      claims: decodeJwtPayload<GoogleTokenClaims>(response.credential) ?? {},
    })
  }
}

function initializeGoogleAccounts(googleAccounts: GoogleAccounts) {
  if (initializedClientId === clientId) return

  googleAccounts.id.initialize({
    client_id: clientId,
    callback: emitCredential,
  })
  initializedClientId = clientId
}

async function initializeButton() {
  if (!clientId) {
    emit('error', new Error('Missing Google client ID'))
    return
  }

  await ensureGoogleScript()

  const googleAccounts = getGoogleAccounts()
  if (!googleAccounts) {
    emit('error', new Error('Google GIS is not available'))
    return
  }

  bindCredentialHandler()
  initializeGoogleAccounts(googleAccounts)

  await nextTick()
  renderButton()
}

onMounted(async () => {
  try {
    await initializeButton()

    if (window.ResizeObserver && root.value) {
      resizeObserver = new ResizeObserver(() => renderButton())
      resizeObserver.observe(root.value)
    }
  } catch (error) {
    emit('error', error)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  credentialHandler = null
})

watch(() => props.options, async () => {
  await nextTick()
  renderButton()
}, { deep: true })
</script>

<template>
  <div
    ref="root"
    class="google-web-login-button"
  />
</template>

<style scoped>
.google-web-login-button {
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  overflow: hidden;
}
</style>
