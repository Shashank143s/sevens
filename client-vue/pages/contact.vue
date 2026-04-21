<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const route = useRoute()
const config = useRuntimeConfig()
const { isCompact } = useUiDensity()
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
    :class="{ 'contact-page--compact': isCompact }"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/" back-label="Home" />

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
          <a class="contact-card__email-box" href="mailto:support@sevensroyale.com" aria-label="Email Sevens Royale Support">
            <span class="contact-card__email-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <span class="contact-card__email-copy">
              <span class="contact-card__email-label">Support Email</span>
              <span class="contact-card__email">support@sevensroyale.com</span>
            </span>
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
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 36%),
    rgba(15, 23, 42, 0.76);
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

.contact-card__email-box {
  display: flex;
  align-items: center;
  gap: 0.72rem;
  margin-top: 0.9rem;
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid rgba(250, 204, 21, 0.24);
  background:
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.1), transparent 46%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.62));
  padding: 0.72rem 0.82rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 14px 30px rgba(2, 6, 23, 0.2);
}

.contact-card__email-box:hover,
.contact-card__email-box:focus-visible {
  border-color: rgba(250, 204, 21, 0.4);
  background:
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.14), transparent 46%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.84), rgba(30, 41, 59, 0.72));
}

.contact-card__email-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(250, 204, 21, 0.28);
  background: rgba(250, 204, 21, 0.14);
  color: #fcd34d;
  flex-shrink: 0;
}

.contact-card__email-icon svg {
  width: 1rem;
  height: 1rem;
}

.contact-card__email-copy {
  min-width: 0;
  display: grid;
  gap: 0.18rem;
}

.contact-card__email-label {
  color: rgba(226, 232, 240, 0.66);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.contact-card__email {
  display: inline-block;
  font-weight: 800;
  font-size: 1.02rem;
  color: #fde68a;
  line-height: 1.2;
}

.contact-card__note {
  font-size: 0.92rem;
}

@media (min-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.contact-page--compact {
  padding:
    max(0.95rem, env(safe-area-inset-top))
    max(0.72rem, env(safe-area-inset-right))
    max(1.2rem, env(safe-area-inset-bottom))
    max(0.72rem, env(safe-area-inset-left));
}

.contact-page--compact .contact-page__content {
  max-width: 53rem;
  gap: 0.65rem;
}

.contact-page--compact .contact-card {
  padding: 0.88rem 0.92rem;
  border-radius: 1rem;
}

.contact-page--compact .contact-card__eyebrow {
  font-size: 0.68rem;
  letter-spacing: 0.16em;
}

.contact-page--compact .contact-card h1 {
  margin-top: 0.3rem;
  font-size: clamp(1.35rem, 4.8vw, 2.15rem);
}

.contact-page--compact .contact-card h2 {
  font-size: 0.94rem;
}

.contact-page--compact .contact-card__lede,
.contact-page--compact .contact-card p {
  margin-top: 0.5rem;
  font-size: 0.82rem;
  line-height: 1.52;
}

.contact-page--compact .contact-card__email-box {
  margin-top: 0.62rem;
  gap: 0.52rem;
  padding: 0.52rem 0.58rem;
  border-radius: 0.74rem;
}

.contact-page--compact .contact-card__email-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.56rem;
}

.contact-page--compact .contact-card__email-icon svg {
  width: 0.84rem;
  height: 0.84rem;
}

.contact-page--compact .contact-card__email-label {
  font-size: 0.56rem;
}

.contact-page--compact .contact-card__email {
  font-size: 0.82rem;
}

.contact-page--compact .contact-card__note {
  font-size: 0.78rem;
}
</style>
