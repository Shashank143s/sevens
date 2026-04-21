<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const route = useRoute()
const config = useRuntimeConfig()
const { isCompact } = useUiDensity()
const canonicalUrl = computed(() => new URL(route.path || '/downloads', config.public.siteUrl).toString())
const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sevensroyale.app'

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

useSeoMeta({
  title: 'Download Sevens on Google Play',
  description: 'Get Sevens Royale on Google Play for Android. iPhone support is currently under development.',
  ogTitle: 'Download Sevens on Google Play - Sevens Royale',
  ogDescription: 'Install Sevens Royale from Google Play and keep the classic Sevens card game one tap away.',
  ogUrl: canonicalUrl,
  robots: 'index, follow',
})
</script>

<template>
  <div
    class="downloads-page"
    :class="{ 'downloads-page--compact': isCompact }"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/account" back-label="Account" />

    <main class="downloads-page__content">
      <section class="downloads-card">
        <div class="downloads-card__hero">
          <div class="downloads-card__copy">
            <p class="downloads-card__eyebrow">Official App Stores</p>
            <h1>Download Sevens Royale</h1>
            <p class="downloads-card__subtitle">
              Install securely from the official storefronts. Android is live on Google Play, and iPhone support is coming soon.
            </p>
          </div>
          <div class="downloads-card__spark" aria-hidden="true">
            <span class="downloads-card__spark-dot downloads-card__spark-dot--gold" />
            <span class="downloads-card__spark-dot downloads-card__spark-dot--mint" />
            <span class="downloads-card__spark-dot downloads-card__spark-dot--sky" />
          </div>
        </div>

        <div class="downloads-card__stores">
          <a
            :href="playStoreUrl"
            class="downloads-store downloads-store--play"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="downloads-store__icon-wrap">
              <img
                src="https://cdn.simpleicons.org/googleplay/34A853"
                alt=""
                class="downloads-store__icon"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div class="downloads-store__copy">
              <p class="downloads-store__eyebrow">Android</p>
              <h2>Google Play</h2>
              <p>Secure install with automatic updates.</p>
            </div>
            <span class="downloads-store__cta">Open</span>
          </a>

          <article class="downloads-store downloads-store--apple" aria-disabled="true">
            <div class="downloads-store__icon-wrap downloads-store__icon-wrap--apple">
              <img
                src="https://cdn.simpleicons.org/apple/FFFFFF"
                alt=""
                class="downloads-store__icon"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div class="downloads-store__copy">
              <p class="downloads-store__eyebrow">iPhone</p>
              <h2>Apple App Store</h2>
              <p>Under development. Use web play for now.</p>
            </div>
            <span class="downloads-store__badge">Soon</span>
          </article>
        </div>

        <div class="downloads-card__footnote">
          <p>
            Prefer desktop or iPhone today? You can keep playing instantly on the web app.
          </p>
          <NuxtLink to="/" class="downloads-card__web-link">
            Open Web App
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.downloads-page {
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

.downloads-page__header {
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

.downloads-page__back {
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

.downloads-page__back:hover,
.downloads-page__back:focus-visible {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(212, 175, 55, 0.22);
}

.downloads-page__content {
  width: 100%;
  max-width: 52rem;
  margin: 0 auto;
}

.downloads-card {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.8rem;
  background:
    radial-gradient(circle at 92% 8%, rgba(250, 204, 21, 0.12), transparent 26%),
    radial-gradient(circle at 8% 88%, rgba(20, 184, 166, 0.1), transparent 30%),
    rgba(15, 23, 42, 0.78);
  box-shadow: 0 22px 55px rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(18px);
}

.downloads-card__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.35rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.14), transparent 28%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96));
}

.downloads-card__copy {
  min-width: 0;
}

.downloads-card__eyebrow {
  margin: 0;
  color: #fcd34d;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.downloads-card__copy h1 {
  margin: 0.45rem 0 0;
  font-size: clamp(1.7rem, 5vw, 2.7rem);
  line-height: 0.98;
  color: #f8fafc;
}

.downloads-card__subtitle {
  margin: 0.7rem 0 0;
  max-width: 35rem;
  color: rgba(203, 213, 225, 0.8);
  line-height: 1.65;
}

.downloads-card__spark {
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  margin-top: 0.2rem;
  padding: 0.42rem 0.52rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.45);
}

.downloads-card__spark-dot {
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 999px;
}

.downloads-card__spark-dot--gold {
  background: #facc15;
}

.downloads-card__spark-dot--mint {
  background: #34d399;
}

.downloads-card__spark-dot--sky {
  background: #38bdf8;
}

.downloads-card__stores {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
  padding: 1rem 1.35rem;
}

.downloads-store {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 5.2rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.78rem 0.86rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03)),
    rgba(255, 255, 255, 0.04);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 16px 32px rgba(2, 6, 23, 0.18);
}

.downloads-store--play {
  border-color: rgba(52, 211, 153, 0.24);
  background:
    radial-gradient(circle at 12% 0%, rgba(16, 185, 129, 0.18), transparent 44%),
    linear-gradient(180deg, rgba(5, 46, 22, 0.34), rgba(255, 255, 255, 0.03));
}

.downloads-store--play:hover,
.downloads-store--play:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(52, 211, 153, 0.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 22px 36px rgba(16, 185, 129, 0.2);
}

.downloads-store--apple {
  border-color: rgba(148, 163, 184, 0.24);
  opacity: 0.95;
}

.downloads-store__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 0.72rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(2, 6, 23, 0.42);
  flex-shrink: 0;
}

.downloads-store__icon-wrap--apple {
  background: rgba(15, 23, 42, 0.66);
}

.downloads-store__icon {
  width: 1.24rem;
  height: 1.24rem;
}

.downloads-store__copy {
  min-width: 0;
  flex: 1;
}

.downloads-store__eyebrow {
  margin: 0;
  color: rgba(186, 230, 253, 0.86);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.62rem;
  font-weight: 800;
}

.downloads-store__copy h2 {
  margin: 0.18rem 0 0;
  color: #f8fafc;
  font-size: 1rem;
  line-height: 1.2;
}

.downloads-store__copy p {
  margin: 0.32rem 0 0;
  color: rgba(203, 213, 225, 0.76);
  font-size: 0.78rem;
  line-height: 1.45;
}

.downloads-store__cta,
.downloads-store__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.65rem;
  min-width: 3.1rem;
  padding: 0.24rem 0.56rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
}

.downloads-store__cta {
  background: linear-gradient(180deg, #22c55e, #16a34a);
  color: #022c22;
}

.downloads-store__badge {
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(51, 65, 85, 0.38);
  color: #cbd5e1;
}

.downloads-card__footnote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.06rem 1.35rem 1.2rem;
}

.downloads-card__footnote p {
  margin: 0;
  color: rgba(203, 213, 225, 0.74);
  font-size: 0.8rem;
}

.downloads-card__web-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.42rem 0.74rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.22);
  background: rgba(250, 204, 21, 0.12);
  color: #fde68a;
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
}

@media (max-width: 760px) {
  .downloads-card__stores {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .downloads-card__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .downloads-card__footnote {
    flex-direction: column;
    align-items: flex-start;
  }
}

.downloads-page--compact {
  padding:
    max(0.95rem, env(safe-area-inset-top))
    max(0.72rem, env(safe-area-inset-right))
    max(1.2rem, env(safe-area-inset-bottom))
    max(0.72rem, env(safe-area-inset-left));
}

.downloads-page--compact .downloads-page__content {
  max-width: 50rem;
}

.downloads-page--compact .downloads-card {
  border-radius: 1rem;
}

.downloads-page--compact .downloads-card__hero {
  gap: 0.72rem;
  padding: 0.9rem 0.95rem 0.82rem;
}

.downloads-page--compact .downloads-card__eyebrow {
  font-size: 0.64rem;
  letter-spacing: 0.15em;
}

.downloads-page--compact .downloads-card__copy h1 {
  margin-top: 0.3rem;
  font-size: clamp(1.3rem, 4.5vw, 1.95rem);
}

.downloads-page--compact .downloads-card__subtitle {
  margin-top: 0.45rem;
  font-size: 0.8rem;
  line-height: 1.45;
}

.downloads-page--compact .downloads-card__spark {
  gap: 0.3rem;
  padding: 0.34rem 0.42rem;
}

.downloads-page--compact .downloads-card__spark-dot {
  width: 0.4rem;
  height: 0.4rem;
}

.downloads-page--compact .downloads-card__stores {
  gap: 0.62rem;
  padding: 0.86rem 0.95rem;
}

.downloads-page--compact .downloads-store {
  min-height: 4.55rem;
  gap: 0.58rem;
  border-radius: 0.8rem;
  padding: 0.6rem 0.64rem;
}

.downloads-page--compact .downloads-store__icon-wrap {
  width: 2.05rem;
  height: 2.05rem;
  border-radius: 0.58rem;
}

.downloads-page--compact .downloads-store__icon {
  width: 1.02rem;
  height: 1.02rem;
}

.downloads-page--compact .downloads-store__eyebrow {
  font-size: 0.55rem;
}

.downloads-page--compact .downloads-store__copy h2 {
  font-size: 0.88rem;
}

.downloads-page--compact .downloads-store__copy p {
  margin-top: 0.26rem;
  font-size: 0.68rem;
}

.downloads-page--compact .downloads-store__cta,
.downloads-page--compact .downloads-store__badge {
  min-height: 1.45rem;
  min-width: 2.58rem;
  font-size: 0.62rem;
}

.downloads-page--compact .downloads-card__footnote {
  gap: 0.6rem;
  padding: 0 0.95rem 0.95rem;
}

.downloads-page--compact .downloads-card__footnote p {
  font-size: 0.72rem;
}

.downloads-page--compact .downloads-card__web-link {
  min-height: 1.8rem;
  padding: 0.34rem 0.58rem;
  font-size: 0.68rem;
}
</style>
