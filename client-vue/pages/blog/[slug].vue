<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { blogPosts, getBlogPost } from '~/data/blog'

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug || ''))
const post = computed(() => getBlogPost(slug.value))
const canonicalUrl = computed(() => new URL(route.path || `/blog/${slug.value}`, config.public.siteUrl).toString())
const relatedPosts = computed(() => blogPosts.filter(entry => entry.slug !== slug.value).slice(0, 3))
const lightboxImage = ref<{ src: string; alt: string } | null>(null)

function openLightbox(src: string, alt: string) {
  lightboxImage.value = { src, alt }
}

function closeLightbox() {
  lightboxImage.value = null
}

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}

useSeoMeta({
  title: `${post.value.title} - Sevens Royale Blog`,
  description: post.value.description,
  ogTitle: `${post.value.title} - Sevens Royale Blog`,
  ogDescription: post.value.description,
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
    v-if="post"
    class="blog-article-page"
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.76), rgba(2, 6, 23, 0.95)), url(${backgroundGame})` }"
  >
    <header class="blog-article-page__header">
      <button type="button" class="blog-article-page__back" @click="router.push('/blog')">← Blog</button>
      <AppUserMenu />
    </header>

    <main class="blog-article-page__content">
      <section class="blog-article-hero">
        <div class="blog-article-hero__copy">
          <p class="blog-article-hero__eyebrow">{{ post.category }}</p>
          <h1>{{ post.title }}</h1>
          <p class="blog-article-hero__description">{{ post.description }}</p>
          <div class="blog-article-hero__meta">
            <span>{{ post.readingTime }}</span>
            <span v-for="keyword in post.keywords" :key="keyword">{{ keyword }}</span>
          </div>
        </div>
        <figure class="blog-article-hero__shot">
          <img
            :src="post.previewImage"
            :alt="post.previewAlt"
            class="blog-article-hero__shot-image blog-image"
            @click="openLightbox(post.previewImage, post.previewAlt)"
          >
          <div class="blog-article-hero__shot-overlay" />
        </figure>
      </section>

      <section class="blog-article-layout">
        <article class="blog-article">
          <section
            v-for="section in post.sections"
            :key="section.title"
            class="blog-article__section"
          >
            <h2>{{ section.title }}</h2>
            <p v-for="paragraph in section.paragraphs" :key="paragraph">
              {{ paragraph }}
            </p>
          </section>

          <section v-if="post.gallery.length" class="blog-article__gallery">
            <div class="blog-article__gallery-head">
              <p class="blog-article__cta-eyebrow">Product screenshots</p>
              <h2>See the game in action.</h2>
            </div>
            <div class="blog-article__gallery-grid">
              <figure
                v-for="shot in post.gallery"
                :key="shot.src"
                class="blog-article__gallery-item"
              >
                <img
                  :src="shot.src"
                  :alt="shot.alt"
                  class="blog-article__gallery-image blog-image"
                  @click="openLightbox(shot.src, shot.alt)"
                >
                <figcaption>
                  <strong>{{ shot.label || 'Preview' }}</strong>
                  <span>{{ shot.alt }}</span>
                </figcaption>
              </figure>
            </div>
          </section>

          <section class="blog-article__cta">
            <p class="blog-article__cta-eyebrow">Ready to play?</p>
            <h2>Jump from the article into a live table.</h2>
            <p>
              Create a room, join a match, or practice against bots in Sevens Royale.
            </p>
            <NuxtLink to="/" class="blog-article__cta-link">
              Play Sevens Royale
            </NuxtLink>
          </section>
        </article>

        <aside class="blog-article-side">
          <section class="blog-article-side__panel">
            <p class="blog-article-side__eyebrow">App preview</p>
            <div class="blog-article-side__shot">
              <img
                :src="post.gallery[0]?.src || post.previewImage"
                :alt="post.gallery[0]?.alt || post.previewAlt"
                class="blog-article-side__shot-image blog-image"
                @click="openLightbox(post.gallery[0]?.src || post.previewImage, post.gallery[0]?.alt || post.previewAlt)"
              >
            </div>
          </section>

          <section class="blog-article-side__panel">
            <p class="blog-article-side__eyebrow">More from the blog</p>
            <div class="blog-article-side__links">
              <NuxtLink
                v-for="related in relatedPosts"
                :key="related.slug"
                :to="`/blog/${related.slug}`"
                class="blog-article-side__link"
              >
                <strong>{{ related.title }}</strong>
                <span>{{ related.readingTime }}</span>
              </NuxtLink>
            </div>
          </section>
        </aside>
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
.blog-article-page {
  min-height: 100dvh;
  padding: 1.4rem 1.25rem 2rem;
  color: #f8fafc;
  background-size: cover;
  background-position: center;
}

.blog-article-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 74rem;
  margin: 0 auto 1.4rem;
}

.blog-article-page__back {
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  font-weight: 700;
}

.blog-article-page__content {
  max-width: 74rem;
  margin: 0 auto;
}

.blog-article-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(20rem, 0.82fr);
  gap: 1rem;
  padding: 1.1rem;
  border-radius: 1.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.15), transparent 28%),
    radial-gradient(circle at left center, rgba(250, 204, 21, 0.14), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.98));
  box-shadow: 0 24px 64px rgba(2, 6, 23, 0.32);
}

.blog-article-hero__eyebrow,
.blog-article-side__eyebrow,
.blog-article__cta-eyebrow {
  margin: 0;
  color: rgba(250, 204, 21, 0.84);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.blog-article-hero h1 {
  margin: 0.55rem 0 0;
  font-size: clamp(2.25rem, 4.2vw, 4rem);
  line-height: 0.96;
}

.blog-article-hero__description {
  margin: 0.9rem 0 0;
  max-width: 42rem;
  color: rgba(203, 213, 225, 0.8);
  font-size: 1rem;
  line-height: 1.75;
}

.blog-article-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}

.blog-article-hero__meta span {
  padding: 0.45rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.66);
  color: rgba(226, 232, 240, 0.86);
  font-size: 0.74rem;
  font-weight: 700;
}

.blog-article-hero__shot,
.blog-article-side__shot {
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 48px rgba(2, 6, 23, 0.24);
  background:
    radial-gradient(circle at top, rgba(56, 189, 248, 0.08), transparent 36%),
    rgba(2, 6, 23, 0.74);
}

.blog-article-hero__shot {
  position: relative;
  margin: 0;
  min-height: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.blog-article-hero__shot-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.08), rgba(2, 6, 23, 0.64));
  pointer-events: none;
}

.blog-article-hero__shot-image,
.blog-article-side__shot-image {
  width: 100%;
  height: 100%;
  max-height: 32rem;
  object-fit: cover;
  object-position: top center;
  border-radius: 1rem;
  position: relative;
  z-index: 1;
}

.blog-article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(16rem, 0.7fr);
  gap: 1rem;
  margin-top: 1rem;
}

.blog-article,
.blog-article-side__panel {
  border-radius: 1.55rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 30%),
    radial-gradient(circle at left top, rgba(250, 204, 21, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.8));
  box-shadow:
    0 22px 54px rgba(2, 6, 23, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
}

.blog-article {
  padding: 1.2rem;
}

.blog-article__section + .blog-article__section {
  margin-top: 1.2rem;
}

.blog-article__section h2,
.blog-article__cta h2 {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.1;
}

.blog-article__section p,
.blog-article__cta p {
  margin: 0.75rem 0 0;
  color: rgba(203, 213, 225, 0.82);
  line-height: 1.85;
  font-size: 1rem;
}

.blog-article__gallery {
  margin-top: 1.35rem;
}

.blog-article__gallery-head h2 {
  margin: 0.35rem 0 0;
  font-size: 1.6rem;
  line-height: 1.1;
}

.blog-article__gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 0.9rem;
}

.blog-article__gallery-item {
  margin: 0;
  overflow: hidden;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top, rgba(56, 189, 248, 0.08), transparent 36%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.76));
  box-shadow:
    0 18px 40px rgba(2, 6, 23, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.blog-article__gallery-image {
  display: block;
  width: 100%;
  min-height: 15rem;
  max-height: 28rem;
  object-fit: cover;
  object-position: top center;
  border-radius: 1rem 1rem 0 0;
  background:
    radial-gradient(circle at top, rgba(56, 189, 248, 0.08), transparent 36%),
    rgba(2, 6, 23, 0.74);
}

.blog-image {
  cursor: zoom-in;
}

.blog-article__gallery-item figcaption {
  display: grid;
  gap: 0.25rem;
  padding: 0.95rem 1rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 32%),
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.82));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(14px);
}

.blog-article__gallery-item strong {
  color: #f8fafc;
  font-size: 0.98rem;
  line-height: 1.25;
}

.blog-article__gallery-item span {
  color: rgba(148, 163, 184, 0.82);
  font-size: 0.82rem;
  line-height: 1.55;
}

.blog-article__cta {
  margin-top: 1.35rem;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(250, 204, 21, 0.12);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.1), transparent 30%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.94));
}

.blog-article__cta-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  margin-top: 0.95rem;
  padding: 0.72rem 1rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #e0bd39, #d1a728);
  color: #17120a;
  font-weight: 800;
}

.blog-article-side {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.blog-article-side__panel {
  padding: 1rem;
}

.blog-article-side__shot {
  min-height: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem;
}

.blog-article-side__links {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.blog-article-side__link {
  display: grid;
  gap: 0.3rem;
  padding: 0.8rem 0.85rem;
  border-radius: 1rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.blog-article-side__link strong {
  color: #f8fafc;
  font-size: 0.94rem;
  line-height: 1.35;
}

.blog-article-side__link span {
  color: rgba(148, 163, 184, 0.82);
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (max-width: 1024px) {
  .blog-article-hero {
    grid-template-columns: 1fr;
  }

  .blog-article-layout {
    grid-template-columns: 1fr;
  }

  .blog-article-side {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .blog-article-page {
    padding: 1rem 0.9rem 1.4rem;
  }

  .blog-article-page__header {
    margin-bottom: 1rem;
  }

  .blog-article-hero,
  .blog-article,
  .blog-article-side__panel {
    border-radius: 1.3rem;
  }

  .blog-article-hero {
    padding: 0.9rem;
  }

  .blog-article-hero h1 {
    font-size: clamp(1.95rem, 9vw, 2.8rem);
  }

  .blog-article-hero__description,
  .blog-article__section p,
  .blog-article__cta p {
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .blog-article {
    padding: 0.95rem;
  }

  .blog-article__section h2,
  .blog-article__cta h2,
  .blog-article__gallery-head h2 {
    font-size: 1.32rem;
  }

  .blog-article__gallery-grid {
    grid-template-columns: 1fr;
  }

  .blog-article__gallery-image {
    min-height: 18rem;
  }

  .blog-article-side__panel {
    padding: 0.9rem;
  }
}
</style>
