<script setup lang="ts">
const blogLobbyScreenshot = '/screenshots/lobby.png'
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { blogPosts } from '~/data/blog'

const route = useRoute()
const config = useRuntimeConfig()
const canonicalPath = computed(() => {
  const path = route.path || '/blog'
  return path.endsWith('/') ? path : `${path}/`
})
const canonicalUrl = computed(() => new URL(canonicalPath.value, config.public.siteUrl).toString())
const lightboxImage = ref<{ src: string; alt: string } | null>(null)

function openLightbox(src: string, alt: string) {
  lightboxImage.value = { src, alt }
}

function closeLightbox() {
  lightboxImage.value = null
}

useSeoMeta({
  title: 'Sevens Royale Blog',
  description: 'Guides, rules, strategy, and online play articles for Sevens card game, Seven Up, and Seven Down players.',
  ogTitle: 'Sevens Royale Blog',
  ogDescription: 'Read Sevens card game guides, rules, and online play articles from Sevens Royale.',
  ogUrl: canonicalUrl,
  robots: 'index, follow',
})

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))
</script>

<template>
  <div
    class="blog-page"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/" back-label="Home" />

    <main class="blog-page__content">
      <section class="blog-hero">
        <div class="blog-hero__copy">
          <p class="blog-hero__eyebrow">Sevens Royale Journal</p>
          <h1>Sevens guides, rules, and online play articles.</h1>
          <p class="blog-hero__subtitle">
            A desktop-first reading space for Sevens card game content, built to help players discover rules,
            strategy, and ways to play Sevens online.
          </p>
        </div>
        <div class="blog-hero__preview">
          <figure class="blog-hero__preview-card">
            <img
              src="/screenshots/lobby.png"
              alt="Sevens Royale lobby screenshot"
              class="blog-hero__preview-image blog-image"
              @click="openLightbox('/screenshots/lobby.png', 'Sevens Royale lobby screenshot')"
            >
            <span>Lobby view</span>
          </figure>
          <figure class="blog-hero__preview-card">
            <img
              src="/screenshots/game-table-start.png"
              alt="Sevens Royale game table screenshot"
              class="blog-hero__preview-image blog-image"
              @click="openLightbox('/screenshots/game-table-start.png', 'Sevens Royale game table screenshot')"
            >
            <span>Table view</span>
          </figure>
        </div>
      </section>

      <section class="blog-grid">
        <article
          v-for="post in blogPosts"
          :key="post.slug"
          class="blog-card"
        >
          <div class="blog-card__visual">
            <img
              :src="post.previewImage"
              :alt="post.previewAlt"
              class="blog-card__visual-image blog-image"
              @click="openLightbox(post.previewImage, post.previewAlt)"
            >
            <div class="blog-card__visual-overlay" />
            <span class="blog-card__category">{{ post.category }}</span>
          </div>
          <div class="blog-card__body">
            <div class="blog-card__meta">
              <span>{{ post.readingTime }}</span>
              <span>{{ post.keywords[0] }}</span>
            </div>
            <h2>{{ post.title }}</h2>
            <p>{{ post.excerpt }}</p>
            <NuxtLink :to="`/blog/${post.slug}`" class="blog-card__cta">
              Read article
            </NuxtLink>
          </div>
        </article>
      </section>
    </main>

    <ImageLightbox
      :visible="!!lightboxImage"
      :src="lightboxImage?.src"
      :alt="lightboxImage?.alt"
      @close="closeLightbox"
    />
  </div>
</template>

<style scoped>
.blog-page {
  min-height: 100dvh;
  padding: 1.4rem 1.25rem 2rem;
  color: #f8fafc;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.4);
}

.blog-page__header {
  position: sticky;
  top: max(0.65rem, env(safe-area-inset-top));
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  margin: 0 0 1.4rem;
  padding: 0.15rem 0;
}

.blog-page__back {
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

.blog-page__back:hover,
.blog-page__back:focus-visible {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(212, 175, 55, 0.22);
}

.blog-page__content {
  max-width: 72rem;
  margin: 0 auto;
}

.blog-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(20rem, 0.9fr);
  gap: 1rem;
  padding: 1.1rem;
  border-radius: 1.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 28%),
    radial-gradient(circle at left center, rgba(250, 204, 21, 0.14), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.98));
  box-shadow: 0 24px 64px rgba(2, 6, 23, 0.32);
}

.blog-hero__eyebrow {
  margin: 0;
  color: rgba(250, 204, 21, 0.84);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.blog-hero h1 {
  margin: 0.55rem 0 0;
  max-width: 46rem;
  font-size: clamp(2.25rem, 4.4vw, 4.2rem);
  line-height: 0.96;
}

.blog-hero__subtitle {
  margin: 0.9rem 0 0;
  max-width: 40rem;
  color: rgba(203, 213, 225, 0.8);
  font-size: 1rem;
  line-height: 1.7;
}

.blog-hero__preview {
  display: grid;
  align-content: center;
  gap: 0.8rem;
}

.blog-hero__preview-card {
  position: relative;
  min-height: 11rem;
  border-radius: 1.4rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 22px 52px rgba(2, 6, 23, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 28%),
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.12), rgba(2, 6, 23, 0.72)),
    rgba(15, 23, 42, 0.88);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem;
  backdrop-filter: blur(18px);
}

.blog-hero__preview-image {
  width: 100%;
  height: 100%;
  max-height: 17rem;
  object-fit: cover;
  object-position: top center;
  border-radius: 1rem;
}

.blog-hero__preview-card span {
  position: absolute;
  left: 1rem;
  bottom: 0.9rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  padding: 0.34rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.18);
  background:
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.16), transparent 58%),
    linear-gradient(180deg, rgba(120, 53, 15, 0.28), rgba(15, 23, 42, 0.76));
  box-shadow:
    0 10px 24px rgba(2, 6, 23, 0.22),
    inset 0 1px 0 rgba(255, 244, 163, 0.08);
  color: #fde68a;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  backdrop-filter: blur(12px);
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.blog-card {
  overflow: hidden;
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 28%),
    radial-gradient(circle at left top, rgba(250, 204, 21, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.78));
  box-shadow:
    0 22px 54px rgba(2, 6, 23, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
}

.blog-card__visual {
  position: relative;
  min-height: 13rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 34%),
    radial-gradient(circle at left top, rgba(250, 204, 21, 0.1), transparent 24%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.88), rgba(2, 6, 23, 0.72));
}

.blog-card__visual-image {
  width: 100%;
  height: 100%;
  max-height: 22rem;
  object-fit: cover;
  object-position: top center;
  border-radius: 1rem;
  position: relative;
  z-index: 1;
}

.blog-image {
  cursor: zoom-in;
}

.blog-card__visual-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.04), rgba(2, 6, 23, 0.74)),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 26%);
}

.blog-card__category {
  position: absolute;
  top: 0.95rem;
  left: 0.95rem;
  z-index: 1;
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.22);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.84), rgba(15, 23, 42, 0.68));
  box-shadow: 0 12px 26px rgba(2, 6, 23, 0.22);
  color: #fde68a;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.blog-card__body {
  padding: 1rem;
}

.blog-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  color: rgba(148, 163, 184, 0.8);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.blog-card h2 {
  margin: 0.55rem 0 0;
  font-size: 1.4rem;
  line-height: 1.1;
}

.blog-card p {
  margin: 0.7rem 0 0;
  color: rgba(203, 213, 225, 0.8);
  line-height: 1.7;
}

.blog-card__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  margin-top: 0.95rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #e0bd39, #d1a728);
  color: #17120a;
  font-weight: 800;
}

@media (max-width: 1024px) {
  .blog-hero {
    grid-template-columns: 1fr;
  }

  .blog-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .blog-page {
    padding: 1rem 0.9rem 1.4rem;
  }

  .blog-page__header {
    margin-bottom: 1rem;
  }

  .blog-hero {
    padding: 0.9rem;
    border-radius: 1.35rem;
  }

  .blog-hero h1 {
    font-size: clamp(1.9rem, 9vw, 2.7rem);
  }

  .blog-hero__subtitle {
    font-size: 0.95rem;
    line-height: 1.65;
  }

  .blog-hero__preview {
    grid-template-columns: 1fr;
  }

  .blog-hero__preview-card {
    min-height: 15rem;
    padding: 0.7rem;
  }

  .blog-hero__preview-card span {
    left: 0.8rem;
    right: 0.8rem;
    bottom: 0.75rem;
    justify-content: center;
    min-height: 2.35rem;
    padding: 0.58rem 0.8rem;
    font-size: 0.82rem;
    letter-spacing: 0.14em;
  }

  .blog-card {
    border-radius: 1.2rem;
  }

  .blog-card__visual {
    min-height: 15rem;
    padding: 0.85rem;
  }

  .blog-card__body {
    padding: 0.9rem;
  }

  .blog-card h2 {
    font-size: 1.18rem;
  }
}
</style>
