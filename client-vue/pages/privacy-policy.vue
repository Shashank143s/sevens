<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const route = useRoute()
const config = useRuntimeConfig()
const canonicalUrl = computed(() => new URL(route.path || '/privacy-policy', config.public.siteUrl).toString())

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

useSeoMeta({
  title: 'Privacy Policy',
  description: 'Read the Sevens Royale Privacy Policy to understand what player, account, country, and gameplay data is collected and how it is used.',
  ogTitle: 'Privacy Policy - Sevens Royale',
  ogDescription: 'See how Sevens Royale collects, uses, and stores account and gameplay data.',
  ogUrl: canonicalUrl,
  robots: 'index, follow',
})
</script>

<template>
  <div
    class="legal-page"
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.92)), url(${backgroundGame})` }"
  >
    <header class="legal-page__header">
      <NuxtLink to="/" class="legal-page__back">
        ← Home
      </NuxtLink>
      <AppUserMenu />
    </header>

    <main class="legal-page__content">
      <section class="legal-card legal-card--hero">
        <p class="legal-card__eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p class="legal-card__lede">
          This Privacy Policy explains what information Sevens Royale collects, how it is used,
          and the choices available to players.
        </p>
      </section>

      <section class="legal-card">
        <h2>1. Information We Collect</h2>
        <p>
          We may collect basic account details such as your name, email address, profile image,
          sign-in time, country information derived from IP or hosting provider headers, and in-game
          activity such as rooms created, coins, XP, leaderboard position, and recent match history.
        </p>
      </section>

      <section class="legal-card">
        <h2>2. How We Use Information</h2>
        <p>
          We use this data to create your player profile, support multiplayer rooms, maintain wallet
          and progression systems, show match history and leaderboards, improve stability, and protect
          the integrity of gameplay.
        </p>
      </section>

      <section class="legal-card">
        <h2>3. Authentication</h2>
        <p>
          Sevens Royale currently uses Google Sign-In for account access. We only use the profile
          data needed to identify your account and personalize your experience inside the game.
        </p>
      </section>

      <section class="legal-card">
        <h2>4. Device, Network, and Gameplay Data</h2>
        <p>
          We may store room participation, stake values, match outcomes, progression changes,
          and technical information required for multiplayer features, reconnect flows, and optional
          features such as notifications or future voice chat support.
        </p>
      </section>

      <section class="legal-card">
        <h2>5. Country Detection</h2>
        <p>
          During account onboarding we may estimate your country using IP-based lookup or trusted
          hosting headers. This is used to support regional display features such as flags on the leaderboard.
        </p>
      </section>

      <section class="legal-card">
        <h2>6. Data Retention and Account Deletion</h2>
        <p>
          Account deletion is handled as a soft delete. This means the account is deactivated rather
          than fully erased immediately, which helps prevent abuse of onboarding rewards and preserves
          game-economy integrity.
        </p>
      </section>

      <section class="legal-card">
        <h2>7. Sharing and Security</h2>
        <p>
          We do not sell your personal information. Data may be processed by infrastructure or auth
          providers needed to run the service. Reasonable technical measures are used to protect stored data,
          but no online service can guarantee absolute security.
        </p>
      </section>

      <section class="legal-card">
        <h2>8. Contact and Changes</h2>
        <p>
          This policy may be updated as the product evolves. Continued use of Sevens Royale after an update
          means you accept the revised policy.
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding:
    max(1.25rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    max(2rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  color: #f8fafc;
  background-size: cover;
  background-position: center;
}

.legal-page__header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.legal-page__back {
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  font-weight: 700;
}

.legal-page__content {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.legal-card {
  padding: 1.2rem 1.25rem;
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.76);
  box-shadow: 0 20px 48px rgba(2, 6, 23, 0.26);
  backdrop-filter: blur(16px);
}

.legal-card--hero {
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 28%),
    radial-gradient(circle at left center, rgba(250, 204, 21, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96));
}

.legal-card__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.legal-card h1,
.legal-card h2 {
  color: #f8f4ec;
}

.legal-card h1 {
  margin: 0.45rem 0 0;
  font-size: clamp(2rem, 6vw, 3.2rem);
  line-height: 0.98;
}

.legal-card h2 {
  margin: 0;
  font-size: 1.12rem;
}

.legal-card__lede,
.legal-card p {
  margin: 0.75rem 0 0;
  color: rgba(226, 232, 240, 0.8);
  line-height: 1.75;
}
</style>
