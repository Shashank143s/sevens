<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const canonicalUrl = computed(() => new URL(route.path || '/terms-and-conditions', config.public.siteUrl).toString())

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

useSeoMeta({
  title: 'Terms and Conditions',
  description: 'Read the Sevens Royale Terms and Conditions covering gameplay, coins, stakes, fair use, accounts, and service availability.',
  ogTitle: 'Terms and Conditions - Sevens Royale',
  ogDescription: 'The Sevens Royale terms covering accounts, fair play, stakes, coins, and service usage.',
  ogUrl: canonicalUrl,
  robots: 'index, follow',
})
</script>

<template>
  <div
    class="legal-page"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <header class="legal-page__header">
      <button
        type="button"
        class="legal-page__back"
        @click="router.push('/')"
      >
        ← Home
      </button>
      <AppUserMenu />
    </header>

    <main class="legal-page__content">
      <section class="legal-card legal-card--hero">
        <p class="legal-card__eyebrow">Legal</p>
        <h1>Terms & Conditions</h1>
        <p class="legal-card__lede">
          These Terms & Conditions govern your access to and use of Sevens Royale.
        </p>
      </section>

      <section class="legal-card">
        <h2>1. Acceptance</h2>
        <p>
          By signing in to Sevens Royale, you agree to follow these Terms & Conditions and the
          Privacy Policy.
        </p>
      </section>

      <section class="legal-card">
        <h2>2. Eligibility and Accounts</h2>
        <p>
          You are responsible for the accuracy of your sign-in details and for your use of the
          account associated with your Google profile.
        </p>
      </section>

      <section class="legal-card">
        <h2>3. Gameplay and Fair Use</h2>
        <p>
          Players must not exploit bugs, tamper with multiplayer flows, automate gameplay unfairly,
          or attempt to manipulate coins, XP, ranks, or match outcomes outside normal play.
        </p>
      </section>

      <section class="legal-card">
        <h2>4. Coins, Stakes, and Progression</h2>
        <p>
          Coins, XP, stakes, ranks, and wallet balances are part of the in-game system and have no
          real-world cash value. Sevens Royale may adjust economy or progression rules as the product evolves.
        </p>
      </section>

      <section class="legal-card">
        <h2>5. Rooms and Match Outcomes</h2>
        <p>
          Match creation, joining, bot participation, private room access, and settlement outcomes
          are governed by the current game rules. Abandoned matches, invalid sessions, or suspicious
          behavior may be restricted or voided to protect fair play.
        </p>
      </section>

      <section class="legal-card">
        <h2>6. Availability</h2>
        <p>
          We may update, suspend, or discontinue parts of the service at any time, including features,
          downloads, multiplayer systems, or progression rules.
        </p>
      </section>

      <section class="legal-card">
        <h2>7. Intellectual Property</h2>
        <p>
          The Sevens Royale application, branding, UI, and service logic remain the property of the
          application owner except where third-party assets or services are used under their own terms.
        </p>
      </section>

      <section class="legal-card">
        <h2>8. Limitation of Liability</h2>
        <p>
          Sevens Royale is provided on an as-is basis. To the fullest extent allowed by law, the service
          is not liable for indirect, incidental, or consequential damages arising from use of the application.
        </p>
      </section>

      <section class="legal-card">
        <h2>9. Changes to Terms</h2>
        <p>
          These terms may change over time. Continued use of the service after updates means you accept
          the revised version.
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
  background-repeat: no-repeat;
  background-attachment: fixed;
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.4);
}

.legal-page__header {
  position: sticky;
  top: max(0.65rem, env(safe-area-inset-top));
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.15rem 0;
}

.legal-page__back {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 40px rgba(2, 6, 23, 0.24);
  backdrop-filter: blur(16px);
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  font-weight: 700;
}

.legal-page__back:hover,
.legal-page__back:focus-visible {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(212, 175, 55, 0.22);
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
