<script setup lang="ts">
const isOnline = ref(true)
const pwa = import.meta.client ? usePWA() : undefined
const splashDismissed = ref(false)
const config = useRuntimeConfig()
const route = useRoute()
const { hydrated: sessionHydrated, hydrateSession } = usePlayerSession()
const authRedirecting = useState<boolean>('auth-redirecting', () => false)
const splashLogoSrc = computed(() => `${config.app.baseURL}branding/sevens-seven-suits-mark.svg`)
const isProtectedRoute = computed(() => route.path !== '/')
const desktopAuthReady = computed(() => !import.meta.client || !isProtectedRoute.value || sessionHydrated.value)
const appContentReady = computed(() => splashDismissed.value && desktopAuthReady.value && !authRedirecting.value)
const router = useRouter()

const showInstallBanner = computed(() =>
  import.meta.client
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
  if (!import.meta.client || route.path !== '/') return
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
  hydrateSession()
  syncOnlineState()
  window.addEventListener('online', syncOnlineState)
  window.addEventListener('offline', syncOnlineState)

  if (window.matchMedia('(max-width: 640px)').matches) {
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

    <Transition name="launch-splash">
      <div
        class="launch-splash"
        :class="{ 'launch-splash--hidden': splashDismissed }"
      >
        <div class="launch-splash__glow launch-splash__glow--left" />
        <div class="launch-splash__glow launch-splash__glow--right" />
        <div class="launch-splash__card">
          <div class="launch-splash__logo-wrap">
            <img
              :src="splashLogoSrc"
              alt="Sevens Royale"
              class="launch-splash__logo"
            >
          </div>
          <p class="launch-splash__eyebrow">The Classic Game, Elevated</p>
          <h1 class="launch-splash__title" aria-label="Sevens">
            <span class="launch-splash__title-char">S</span>
            <span class="launch-splash__title-char">E</span>
            <span class="launch-splash__title-char">V</span>
            <span class="launch-splash__title-char launch-splash__title-char--mirror">E</span>
            <span class="launch-splash__title-char launch-splash__title-char--mirror">N</span>
            <span class="launch-splash__title-char launch-splash__title-char--mirror">S</span>
          </h1>
          <p class="launch-splash__subtitle">Let's play!</p>
        </div>
      </div>
    </Transition>

    <div
      class="app-shell__content"
      :class="{ 'app-shell__content--ready': appContentReady }"
    >
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

      <NuxtPage />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  height: 100%;
}

.app-shell__content {
  height: 100%;
}

.app-shell__content:not(.app-shell__content--ready) {
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 640px) {
  .app-shell__content--ready {
    opacity: 1;
    pointer-events: auto;
  }
}
.launch-splash {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(209, 167, 40, 0.16), transparent 34%),
    linear-gradient(180deg, #04140d 0%, #041a13 42%, #020617 100%);
}

.launch-splash--hidden {
  opacity: 0;
  pointer-events: none;
}

@media (min-width: 641px) {
  .launch-splash {
    display: none;
  }

  .app-shell__content {
    transition: opacity 0.18s ease;
  }
}

.launch-splash__glow {
  position: absolute;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  filter: blur(22px);
  opacity: 0.6;
}

.launch-splash__glow--left {
  left: -4rem;
  bottom: 12%;
  background: rgba(20, 184, 166, 0.14);
}

.launch-splash__glow--right {
  right: -5rem;
  top: 10%;
  background: rgba(209, 167, 40, 0.18);
}

.launch-splash__card {
  position: relative;
  z-index: 1;
  width: min(24rem, calc(100vw - 3rem));
  padding: 2rem 1.75rem;
  border: 1px solid rgba(248, 250, 252, 0.08);
  border-radius: 2rem;
  text-align: center;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.4);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.4);
  backdrop-filter: blur(18px);
}

.launch-splash__logo-wrap {
  width: 5.75rem;
  height: 5.75rem;
  margin: 0 auto 1.25rem;
  padding: 0.7rem;
  border-radius: 1.6rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(15, 23, 42, 0.55));
  box-shadow: 0 18px 45px rgba(2, 6, 23, 0.38);
}

.launch-splash__logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.launch-splash__eyebrow {
  margin: 0 0 0.65rem;
  color: #d4af37;
  font-size: 0.76rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.launch-splash__title {
  margin: 0;
  font-family: 'Arial Black', Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
  font-size: clamp(2.2rem, 10vw, 3.4rem);
  line-height: 0.95;
  letter-spacing: 0.04em;
  color: #f8f4ec;
  display: inline-flex;
  align-items: baseline;
  gap: 0.01em;
}

.launch-splash__title-char {
  display: inline-block;
}

.launch-splash__title-char--mirror {
  transform: scaleX(-1);
}

.launch-splash__subtitle {
  margin: 1rem 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 0.98rem;
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
