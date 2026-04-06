<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const canonicalUrl = computed(() => new URL(route.path || '/contact', config.public.siteUrl).toString())

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

useSeoMeta({
  title: 'Contact Us',
  description: 'Contact Sevens Royale for support, feedback, partnership ideas, or game questions. Reach the developer team at support@sevensroyale.com.',
  ogTitle: 'Contact Us - Sevens Royale',
  ogDescription: 'Get in touch with the Sevens Royale developer team for support, feedback, or questions about the game.',
  ogUrl: canonicalUrl,
  robots: 'index, follow',
})
</script>

<template>
  <div
    class="contact-page"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <header class="contact-page__header">
      <button
        type="button"
        class="contact-page__back"
        @click="router.push('/')"
      >
        ← Home
      </button>
      <AppUserMenu />
    </header>

    <main class="contact-page__content">
      <section class="contact-card contact-card--hero">
        <div>
          <p class="contact-card__eyebrow">Contact Us</p>
          <h1>We'd love to hear from you</h1>
          <p class="contact-card__lede">
            Sevens Royale is a modern online version of the classic Sevens card game, built for quick mobile play,
            private rooms, bot matches, progression, and a polished multiplayer experience.
          </p>
        </div>
      </section>

      <section class="contact-grid">
        <article class="contact-card">
          <h2>About the Game</h2>
          <p>
            Sevens Royale brings the traditional Sevens card game, also known to many players as Seven Up or
            Seven Down, to the web with live rooms, coins, XP, leaderboards, and a mobile-friendly interface.
          </p>
          <p>
            Whether you're here to play casually with friends or compete for coins and rank, the game is designed
            to stay fast, simple, and fun.
          </p>
        </article>

        <article class="contact-card">
          <h2>Developer Support</h2>
          <p>
            For support, bug reports, business inquiries, or feedback, please email the developer team at:
          </p>
          <a class="contact-card__email" href="mailto:support@sevensroyale.com">
            support@sevensroyale.com
          </a>
          <p class="contact-card__note">
            Include your device, browser, and a short description if you are reporting an issue.
          </p>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.contact-page {
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

.contact-page__header {
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

.contact-page__back {
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

.contact-page__back:hover,
.contact-page__back:focus-visible {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(212, 175, 55, 0.22);
}

.contact-page__content {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.contact-grid {
  display: grid;
  gap: 1rem;
}

.contact-card {
  padding: 1.2rem 1.25rem;
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.76);
  box-shadow: 0 20px 48px rgba(2, 6, 23, 0.26);
  backdrop-filter: blur(16px);
}

.contact-card--hero {
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 28%),
    radial-gradient(circle at left center, rgba(250, 204, 21, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96));
}

.contact-card__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.contact-card h1,
.contact-card h2 {
  color: #f8f4ec;
}

.contact-card h1 {
  margin: 0.45rem 0 0;
  font-size: clamp(2rem, 6vw, 3.2rem);
  line-height: 0.98;
}

.contact-card h2 {
  margin: 0;
  font-size: 1.12rem;
}

.contact-card__lede,
.contact-card p {
  margin: 0.75rem 0 0;
  color: rgba(226, 232, 240, 0.8);
  line-height: 1.75;
}

.contact-card__email {
  display: inline-block;
  margin-top: 0.9rem;
  font-weight: 800;
  font-size: 1.02rem;
  color: #fde68a;
}

.contact-card__note {
  font-size: 0.92rem;
}

@media (min-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
