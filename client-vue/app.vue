<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import WebSplashScreen from '~/components/WebSplashScreen.vue'
import { normalizePath } from '~/utils/normalizePath'

const isOnline = ref(true)
const pwa = import.meta.client ? usePWA() : undefined
const mounted = ref(false)
const nativeApp = ref(false)
const splashDismissed = ref(false)
const config = useRuntimeConfig()
const route = useRoute()
const { hydrated: sessionHydrated, hydrateSession } = usePlayerSession()
const authRedirecting = useState<boolean>('auth-redirecting', () => false)
const appSource = computed(() => config.public.appSource || 'web')
const splashLogoSrc = computed(() => `${config.app.baseURL}branding/sevens-seven-suits-mark.svg`)
const normalizedRoutePath = computed(() => normalizePath(route.path))
const isAndroidBuild = computed(() => appSource.value === 'android')
const isNativeApp = computed(() => isAndroidBuild.value || (mounted.value && nativeApp.value))
const showWebSplash = computed(() => appSource.value === 'web' && mounted.value && !nativeApp.value)
const isProtectedRoute = computed(() => normalizedRoutePath.value !== '/')
const desktopAuthReady = computed(() => !import.meta.client || !isProtectedRoute.value || sessionHydrated.value)
const router = useRouter()

const showInstallBanner = computed(() =>
  mounted.value
  && !isNativeApp.value
  && !!pwa?.showInstallPrompt
  && !pwa?.isPWAInstalled,
)

const showOfflineBanner = computed(() => import.meta.client && !isOnline.value)
const showRefreshBanner = computed(() => import.meta.client && !!pwa?.needRefresh)
const showReadyBanner = computed(() => import.meta.client && !!pwa?.offlineReady && isOnline.value)

async function installApp() {
  await pwa?.install()
}

async function refreshApp() {
  await pwa?.updateServiceWorker(true)
}

function dismissInstallBanner() {
  pwa?.cancelInstall()
}

function dismissStatusBanner() {
  pwa?.cancelPrompt()
}

function syncOnlineState() {
  if (!import.meta.client) return
  isOnline.value = navigator.onLine
}

function releaseAuthRedirect() {
  if (!import.meta.client || normalizedRoutePath.value !== '/') return
  window.requestAnimationFrame(() => {
    authRedirecting.value = false
  })
}

async function handleProtectedRouteRedirect() {
  if (!import.meta.client) return
  if (!sessionHydrated.value) return
  if (!authRedirecting.value) return
  if (!isProtectedRoute.value) {
    releaseAuthRedirect()
    return
  }

  await router.replace('/')
}

onMounted(() => {
  mounted.value = true
  nativeApp.value = Capacitor.isNativePlatform()
  hydrateSession()
  syncOnlineState()
  window.addEventListener('online', syncOnlineState)
  window.addEventListener('offline', syncOnlineState)

  if (nativeApp.value) {
    splashDismissed.value = true
  } else if (window.matchMedia('(max-width: 640px)').matches) {
    window.setTimeout(() => {
      splashDismissed.value = true
    }, 2000)
  } else {
    splashDismissed.value = true
  }

  handleProtectedRouteRedirect()
  releaseAuthRedirect()
})

watch(() => route.fullPath, () => {
  handleProtectedRouteRedirect()
  releaseAuthRedirect()
})

watch([sessionHydrated, isProtectedRoute, authRedirecting], () => {
  handleProtectedRouteRedirect()
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('online', syncOnlineState)
  window.removeEventListener('offline', syncOnlineState)
})
</script>

<template>
  <div class="app-shell">
    <NuxtPwaAssets />
    <NuxtPwaManifest />

    <ClientOnly>
      <template #fallback>
        <WebSplashScreen :logo-src="splashLogoSrc" :neutral="isAndroidBuild" />
      </template>
      <Transition name="launch-splash">
        <WebSplashScreen
          v-if="showWebSplash"
          :logo-src="splashLogoSrc"
          :hidden="splashDismissed"
        />
      </Transition>
    </ClientOnly>

    <div class="app-shell__content app-shell__content--ready">
      <ClientOnly>
        <Transition name="status-banner">
          <div v-if="showOfflineBanner" class="status-banner status-banner--offline">
            <p>Offline mode: cached screens are available, but live multiplayer needs a connection.</p>
          </div>
        </Transition>

        <Transition name="status-banner">
          <div v-if="showInstallBanner" class="status-banner status-banner--install">
            <p>Install Sevens Royale for a full-screen, app-like experience and faster return visits.</p>
            <div class="status-banner__actions">
              <button type="button" class="status-banner__button status-banner__button--primary" @click="installApp">
                Install
              </button>
              <button type="button" class="status-banner__button" @click="dismissInstallBanner">
                Not now
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="status-banner">
          <div v-if="showRefreshBanner" class="status-banner status-banner--refresh">
            <p>A newer version of the app is ready.</p>
            <div class="status-banner__actions">
              <button type="button" class="status-banner__button status-banner__button--primary" @click="refreshApp">
                Refresh
              </button>
              <button type="button" class="status-banner__button" @click="dismissStatusBanner">
                Later
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="status-banner">
          <div v-if="showReadyBanner" class="status-banner status-banner--ready">
            <p>The app is ready for offline shell access.</p>
            <div class="status-banner__actions">
              <button type="button" class="status-banner__button status-banner__button--primary" @click="dismissStatusBanner">
                Dismiss
              </button>
            </div>
          </div>
        </Transition>
      </ClientOnly>

      <NuxtPage />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  height: 100%;
  background:
    radial-gradient(circle at top, rgba(209, 167, 40, 0.16), transparent 34%),
    linear-gradient(180deg, #04140d 0%, #041a13 42%, #020617 100%);
}

.app-shell__content {
  height: 100%;
}

.app-shell__content--ready {
  opacity: 1;
  pointer-events: auto;
}

@media (min-width: 641px) {
  .app-shell__content {
    transition: opacity 0.18s ease;
  }
}

.status-banner {
  position: fixed;
  left: 1rem;
  right: 1rem;
  top: max(1rem, env(safe-area-inset-top));
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1rem;
  color: #f8fafc;
  backdrop-filter: blur(20px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.32);
}

.status-banner p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.status-banner--offline {
  background: rgba(127, 29, 29, 0.92);
}

.status-banner--install {
  background: rgba(15, 23, 42, 0.94);
}

.status-banner--refresh {
  background: rgba(8, 47, 73, 0.94);
}

.status-banner--ready {
  background: rgba(20, 83, 45, 0.94);
}

.status-banner__actions {
  display: flex;
  gap: 0.65rem;
  flex-shrink: 0;
}

.status-banner__button {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  border-radius: 999px;
  padding: 0.6rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1;
}

.status-banner__button--primary {
  background: #d1a728;
  color: #17120a;
  border-color: rgba(209, 167, 40, 0.7);
}

.status-banner-enter-active,
.status-banner-leave-active {
  transition: all 0.2s ease;
}

.status-banner-enter-from,
.status-banner-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.launch-splash-enter-active,
.launch-splash-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.launch-splash-enter-from,
.launch-splash-leave-to {
  opacity: 0;
}

.launch-splash-leave-to .launch-splash__card {
  transform: scale(0.97);
}

@media (max-width: 640px) {
  .status-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .status-banner__actions {
    width: 100%;
  }

  .status-banner__button {
    flex: 1;
    justify-content: center;
  }
}
</style>
