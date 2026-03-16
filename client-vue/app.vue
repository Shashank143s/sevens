<script setup lang="ts">
const isOnline = ref(true)
const pwa = import.meta.client ? usePWA() : undefined

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

onMounted(() => {
  syncOnlineState()
  window.addEventListener('online', syncOnlineState)
  window.addEventListener('offline', syncOnlineState)
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('online', syncOnlineState)
  window.removeEventListener('offline', syncOnlineState)
})
</script>

<template>
  <div class="app-shell">
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
</template>

<style scoped>
.app-shell {
  min-height: 100dvh;
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
