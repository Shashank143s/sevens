<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const router = useRouter()
const { session } = usePlayerSession()
const { openAuth } = useGoogleLogin()
const pwa = import.meta.client ? usePWA() : undefined

const isLoggedIn = computed(() => !!session.value?.name?.trim())
const homeCtaLabel = computed(() => (isLoggedIn.value ? 'Get Started' : 'Login to Play'))
const canInstallApp = computed(() =>
  import.meta.client
  && !!pwa?.showInstallPrompt
  && !pwa?.isPWAInstalled,
)

function handleHomeCta() {
  if (isLoggedIn.value) {
    router.push('/lobby')
    return
  }
  openAuth()
}

async function handleInstallApp() {
  await pwa?.install()
}
</script>

<template>
  <div
    class="home-shell h-screen min-h-[100dvh] overflow-hidden text-white relative bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <div class="absolute top-0 right-0 z-10 p-4 sm:p-6">
      <AppUserMenu />
    </div>

    <section class="mobile-home">
      <div class="mobile-home__content">
        <p class="mobile-home__eyebrow">The Classic Game, Elevated</p>
        <h1 class="mobile-home__title">Sevens Royale</h1>
        <p class="mobile-home__description">
          Play the timeless card game of Sevens online. Create a room, invite friends
          or add AI bots, and be the first to play all your cards.
        </p>
        <div class="mobile-home__divider" aria-hidden="true">
          <span class="mobile-home__line" />
          <span class="mobile-home__suits">♠ ♥ ♦ ♣</span>
          <span class="mobile-home__line" />
        </div>
        <button
          type="button"
          class="mobile-home__cta"
          @click="handleHomeCta"
        >
          <span class="mobile-home__cta-label">{{ homeCtaLabel }}</span>
          <span class="mobile-home__cta-arrow">›</span>
        </button>
        <button
          v-if="canInstallApp"
          type="button"
          class="mobile-home__secondary-cta"
          @click="handleInstallApp"
        >
          Install App
        </button>
      </div>
      <p class="mobile-home__footnote">2-4 Players · Build sequences from 7 · First to empty hand wins</p>
    </section>
  </div>

  <GoogleLoginModal />
</template>

<style scoped>
.home-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.mobile-home {
  position: relative;
  z-index: 1;
  height: 100dvh;
  width: 100%;
  padding:
    max(2rem, env(safe-area-inset-top))
    max(1.5rem, env(safe-area-inset-right))
    max(2.5rem, env(safe-area-inset-bottom))
    max(1.5rem, env(safe-area-inset-left));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: rgba(0, 0, 0, 0.4);
}

.mobile-home__content {
  width: 100%;
  max-width: 46rem;
}

.mobile-home__eyebrow {
  margin: 0 0 1.5rem;
  color: #d4af37;
  font-size: clamp(0.66rem, 2.4vw, 1.1rem);
  letter-spacing: clamp(0.12em, 0.55vw, 0.28em);
  text-transform: uppercase;
  white-space: nowrap;
}

.mobile-home__title {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(3.4rem, 9vw, 7rem);
  line-height: 0.95;
  font-weight: 600;
  color: #f8f4ec;
}

.mobile-home__description {
  margin: 1.75rem auto 0;
  max-width: 38rem;
  color: rgba(226, 232, 240, 0.72);
  font-size: clamp(1rem, 2vw, 1.45rem);
  line-height: 1.65;
}

.mobile-home__divider {
  margin: 2.25rem auto 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.45rem, 2vw, 1rem);
  flex-wrap: nowrap;
}

.mobile-home__line {
  width: clamp(2.5rem, 14vw, 4.5rem);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.9), transparent);
  flex: 0 0 auto;
}

.mobile-home__suits {
  color: #a88a2b;
  display: inline-flex;
  align-items: center;
  font-size: clamp(1.05rem, 4.2vw, 1.85rem);
  letter-spacing: clamp(0.08em, 0.8vw, 0.28em);
  white-space: nowrap;
  flex: 0 0 auto;
}

.mobile-home__cta {
  width: min(100%, 22rem);
  min-height: 4.25rem;
  padding: 0.95rem 1.4rem;
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 999px;
  background: linear-gradient(180deg, #e0bd39, #d1a728);
  color: #17120a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.95rem;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 18px 40px rgba(209, 167, 40, 0.18);
}

.mobile-home__cta-label {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.mobile-home__cta-arrow {
  display: inline-flex;
  align-items: center;
  font-size: 1.35rem;
  line-height: 1;
}

.mobile-home__footnote {
  position: absolute;
  left: 1.5rem;
  right: 1.5rem;
  bottom: max(1.5rem, env(safe-area-inset-bottom));
  margin: 0;
  color: rgba(148, 163, 184, 0.45);
  font-size: 0.92rem;
  line-height: 1.5;
  text-align: center;
}

.mobile-home__secondary-cta {
  margin-top: 0.85rem;
  width: min(100%, 22rem);
  min-height: 3.5rem;
  padding: 0.85rem 1.4rem;
  border: 1px solid rgba(248, 244, 236, 0.28);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.62);
  color: #f8f4ec;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.98rem;
  font-weight: 700;
  backdrop-filter: blur(12px);
}

@media (min-width: 640px) {
  .mobile-home {
    padding:
      max(3rem, env(safe-area-inset-top))
      max(2rem, env(safe-area-inset-right))
      max(3rem, env(safe-area-inset-bottom))
      max(2rem, env(safe-area-inset-left));
  }

  .mobile-home__divider {
    margin: 2.75rem auto 3rem;
  }

  .mobile-home__cta {
    width: min(100%, 25rem);
    min-height: 4.5rem;
    font-size: 1.1rem;
  }

  .mobile-home__secondary-cta {
    width: min(100%, 25rem);
  }

  .mobile-home__footnote {
    position: static;
    margin-top: 7rem;
    max-width: 42rem;
    font-size: 1rem;
  }
}
</style>
