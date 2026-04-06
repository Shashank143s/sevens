<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const { session } = usePlayerSession()
const { openAuth } = useGoogleLogin()
const pwa = import.meta.client ? usePWA() : undefined
const canonicalUrl = computed(() => new URL(route.path || '/', config.public.siteUrl).toString())

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Sevens Royale',
        url: config.public.siteUrl,
        description: 'Play Sevens online with friends, private rooms, bots, coins, and ranked progression.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${config.public.siteUrl}/instructions`,
          'query-input': 'required name=search_term_string',
        },
      }),
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Sevens Royale',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web, Android',
        url: config.public.siteUrl,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        alternateName: ['Sevens card game', 'Seven Up Seven Down'],
      }),
    },
  ],
}))

useSeoMeta({
  title: 'Play Sevens Card Game Online',
  description: 'Play Sevens online with friends or bots. Sevens Royale brings the classic Sevens card game, also searched as Seven Up or Seven Down, to multiplayer web and Android play.',
  ogTitle: 'Sevens Royale - Play Sevens Card Game Online',
  ogDescription: 'Create private rooms, play Sevens with friends, earn coins, and climb the leaderboard in Sevens Royale.',
  ogUrl: canonicalUrl,
  ogImage: `${config.public.siteUrl}/branding/sevens-seven-suits-mark.svg`,
  twitterTitle: 'Sevens Royale - Play Sevens Card Game Online',
  twitterDescription: 'Classic Sevens card game online with rooms, bots, coins, and leaderboard progression.',
  robots: 'index, follow',
})

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
    class="home-shell box-border min-h-[100dvh] overflow-x-hidden text-white relative bg-cover bg-center bg-no-repeat"
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
          Play the timeless card game of Sevens online. If you know it as Seven Up or
          Seven Down, this is the same fast, sequence-building card game with rooms,
          bots, and live multiplayer.
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
    </section>

    <footer class="home-footer" aria-label="Sevens Royale information">
      <div class="home-footer__inner">
        <p class="home-footer__copy">
          Sevens Royale is a multiplayer card game with secure Google Sign-In for account access and sync across devices.
        </p>
        <nav class="home-footer__links">
          <NuxtLink to="/instructions" class="home-footer__link">
            Instructions
          </NuxtLink>
          <NuxtLink to="/blog" class="home-footer__link">
            Blog
          </NuxtLink>
          <NuxtLink to="/privacy-policy" class="home-footer__link">
            Privacy Policy
          </NuxtLink>
          <NuxtLink to="/terms-and-conditions" class="home-footer__link">
            Terms
          </NuxtLink>
          <NuxtLink to="/contact" class="home-footer__link">
            Contact
          </NuxtLink>
        </nav>
        <p class="home-footer__copyright">
          &copy; 2026 Droidking Developers
        </p>
      </div>
    </footer>
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

.home-shell {
  display: flex;
  flex-direction: column;
}

.mobile-home {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  width: 100%;
  padding:
    max(2rem, env(safe-area-inset-top))
    max(1.5rem, env(safe-area-inset-right))
    1.5rem
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

.home-footer {
  position: relative;
  z-index: 1;
  width: 100%;
  padding:
    0.9rem
    max(1.25rem, env(safe-area-inset-right))
    max(0.9rem, env(safe-area-inset-bottom))
    max(1.25rem, env(safe-area-inset-left));
  background: linear-gradient(180deg, rgba(4, 20, 13, 0.16), rgba(4, 20, 13, 0.82) 18%, rgba(6, 20, 31, 0.96));
  border-top: 1px solid rgba(248, 244, 236, 0.08);
}

.home-footer__inner {
  width: min(100%, 68rem);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.home-footer__copy {
  margin: 0;
  color: rgba(226, 232, 240, 0.76);
  font-size: 0.74rem;
  line-height: 1.4;
  text-align: center;
}

.home-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem 0.9rem;
}

.home-footer__link {
  color: #e4c862;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
}

.home-footer__link:hover,
.home-footer__link:focus-visible {
  color: #f8e39a;
  text-decoration: underline;
}

.home-footer__copyright {
  margin: 0;
  color: rgba(148, 163, 184, 0.68);
  font-size: 0.72rem;
  line-height: 1.35;
  text-align: center;
}

@media (min-width: 640px) {
  .mobile-home {
    flex: 1 1 auto;
    min-height: 0;
    padding:
      max(3rem, env(safe-area-inset-top))
      max(2rem, env(safe-area-inset-right))
      2rem
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

  .home-footer {
    padding:
      1rem
      max(2rem, env(safe-area-inset-right))
      max(0.95rem, env(safe-area-inset-bottom))
      max(2rem, env(safe-area-inset-left));
  }

  .home-footer__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 1.25rem;
  }

  .home-footer__copy {
    max-width: 40rem;
    font-size: 0.86rem;
    text-align: left;
  }

  .home-footer__links {
    justify-content: flex-end;
    gap: 0.85rem 1.2rem;
    flex-shrink: 0;
  }

  .home-footer__link {
    font-size: 0.84rem;
  }

  .home-footer__copyright {
    grid-column: 1 / -1;
    font-size: 0.76rem;
    text-align: left;
  }
}
</style>
