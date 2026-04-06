<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import apkUrl from '~/assets/downloads/Sevens.apk?url'

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const canonicalUrl = computed(() => new URL(route.path || '/downloads', config.public.siteUrl).toString())

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

useSeoMeta({
  title: 'Download Sevens APK',
  description: 'Download the Sevens Royale Android APK and install the Sevens card game on your device. iPhone support is currently under development.',
  ogTitle: 'Download Sevens APK - Sevens Royale',
  ogDescription: 'Get the Android APK for Sevens Royale and keep the classic Sevens card game one tap away.',
  ogUrl: canonicalUrl,
  robots: 'index, follow',
})
</script>

<template>
  <div
    class="downloads-page"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <header class="downloads-page__header">
      <button
        type="button"
        class="downloads-page__back"
        @click="router.push('/account')"
      >
        ← Account
      </button>
      <AppUserMenu />
    </header>

    <main class="downloads-page__content">
      <section class="downloads-card">
        <div class="downloads-card__hero">
          <div class="downloads-card__copy">
            <p class="downloads-card__eyebrow">Android Build</p>
            <h1>Download Sevens APK</h1>
            <p class="downloads-card__subtitle">
              Install Sevens Royale directly on your Android device and keep the full app experience one tap away.
            </p>
          </div>
          <div class="downloads-card__android">
            <IconsAndroidIcon class="downloads-card__android-icon" />
          </div>
        </div>

        <div class="downloads-card__body">
          <div class="downloads-card__details">
            <div class="downloads-card__pill">
              <IconsAndroidIcon class="downloads-card__pill-icon" />
              <span>Android APK</span>
            </div>
            <p class="downloads-card__note">
              If your browser warns about direct APK installs, allow the download first and then open the file from your device downloads.
            </p>
          </div>

          <a
            :href="apkUrl"
            download="Sevens.apk"
            class="downloads-card__button"
          >
            <IconsAndroidIcon class="downloads-card__button-icon" />
            <span>Download APK</span>
          </a>
        </div>

        <div class="downloads-card__ios">
          <div class="downloads-card__ios-copy">
            <p class="downloads-card__ios-eyebrow">iPhone</p>
            <h2>iOS build is under development</h2>
            <p>
              We are working on the iPhone version right now. Until then, iPhone users can keep playing through the web app experience.
            </p>
          </div>
          <div class="downloads-card__ios-badge">
            Coming Soon
          </div>
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
  background: rgba(15, 23, 42, 0.76);
  box-shadow: 0 22px 55px rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(18px);
}

.downloads-card__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.35rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.14), transparent 26%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96));
}

.downloads-card__copy {
  min-width: 0;
}

.downloads-card__eyebrow {
  margin: 0;
  color: #86efac;
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
  max-width: 34rem;
  color: rgba(203, 213, 225, 0.8);
  line-height: 1.7;
}

.downloads-card__android {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  flex-shrink: 0;
  border-radius: 1.4rem;
  border: 1px solid rgba(74, 222, 128, 0.18);
  background:
    radial-gradient(circle at top, rgba(74, 222, 128, 0.18), transparent 42%),
    rgba(255, 255, 255, 0.05);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 18px 36px rgba(2, 6, 23, 0.22);
}

.downloads-card__android-icon {
  width: 2.2rem;
  height: 2.2rem;
  color: #86efac;
}

.downloads-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.35rem 1.35rem;
}

.downloads-card__ios {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.35rem 1.35rem;
}

.downloads-card__ios-copy {
  min-width: 0;
}

.downloads-card__ios-eyebrow {
  margin: 0;
  color: #bfdbfe;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.downloads-card__ios-copy h2 {
  margin: 0.45rem 0 0;
  font-size: 1.2rem;
  color: #f8fafc;
}

.downloads-card__ios-copy p {
  margin: 0.6rem 0 0;
  color: rgba(203, 213, 225, 0.74);
  line-height: 1.65;
}

.downloads-card__ios-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  background: rgba(59, 130, 246, 0.12);
  color: #dbeafe;
  font-size: 0.82rem;
  font-weight: 800;
  flex-shrink: 0;
}

.downloads-card__details {
  min-width: 0;
}

.downloads-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.4rem;
  padding: 0.48rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(74, 222, 128, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: #dcfce7;
  font-size: 0.88rem;
  font-weight: 800;
}

.downloads-card__pill-icon {
  width: 1rem;
  height: 1rem;
  color: #86efac;
}

.downloads-card__note {
  margin: 0.9rem 0 0;
  color: rgba(203, 213, 225, 0.76);
  line-height: 1.65;
}

.downloads-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 3.25rem;
  padding: 0.8rem 1.2rem;
  border-radius: 1rem;
  border: 1px solid rgba(74, 222, 128, 0.22);
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #03150a;
  font-weight: 900;
  box-shadow: 0 18px 40px rgba(34, 197, 94, 0.22);
  flex-shrink: 0;
}

.downloads-card__button-icon {
  width: 1.1rem;
  height: 1.1rem;
}

@media (max-width: 640px) {
  .downloads-card__hero,
  .downloads-card__body,
  .downloads-card__ios {
    flex-direction: column;
    align-items: flex-start;
  }

  .downloads-card__android {
    width: 4.4rem;
    height: 4.4rem;
  }

  .downloads-card__button {
    width: 100%;
  }
}
</style>
