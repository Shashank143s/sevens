<script setup lang="ts">
import type { NuxtError } from '#app'
import backgroundGame from '~/assets/images/poker_cards_table.png'

const props = defineProps<{
  error: NuxtError
}>()

const { session } = usePlayerSession()

const attemptedPath = computed(() => {
  const statusMessage = props.error?.statusMessage ?? ''
  const message = props.error?.message ?? ''
  const full = `${statusMessage} ${message}`.trim()
  const match = full.match(/(\/[^\s]*)/)
  return match?.[1] ?? null
})

const primaryAction = computed(() => {
  if (session.value?.name?.trim()) {
    return {
      label: 'Back to Lobby',
      action: () => clearError({ redirect: '/lobby' }),
    }
  }

  return {
    label: 'Go Home',
    action: () => clearError({ redirect: '/' }),
  }
})

const title = computed(() => {
  if (props.error?.statusCode === 404) return 'This room doesn’t exist.'
  return 'Something interrupted the game.'
})

const description = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'The route you tried to open is not part of Sevens Royale. Head back to a live table or return home to start a new session.'
  }

  return 'The app hit an unexpected issue. Return to safety and jump back in when you are ready.'
})
</script>

<template>
  <div
    class="error-page"
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.74), rgba(2, 6, 23, 0.9)), url(${backgroundGame})` }"
  >
    <div class="error-page__backdrop error-page__backdrop--left" />
    <div class="error-page__backdrop error-page__backdrop--right" />

    <main class="error-page__content">
      <section class="error-card">
        <p class="error-card__eyebrow">
          {{ props.error?.statusCode === 404 ? 'Wrong Table' : 'Unexpected Shuffle' }}
        </p>
        <h1 class="error-card__title">{{ title }}</h1>
        <p class="error-card__description">
          {{ description }}
        </p>

        <p v-if="attemptedPath" class="error-card__path">
          Attempted route: <span>{{ attemptedPath }}</span>
        </p>

        <div class="error-card__actions">
          <button type="button" class="error-card__primary" @click="primaryAction.action()">
            {{ primaryAction.label }}
          </button>
          <NuxtLink to="/instructions" class="error-card__secondary">
            View Instructions
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.error-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
    max(1.5rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    max(2rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  color: #f8fafc;
  background-size: cover;
  background-position: center;
}

.error-page__backdrop {
  position: absolute;
  border-radius: 999px;
  filter: blur(26px);
  opacity: 0.55;
}

.error-page__backdrop--left {
  left: -6rem;
  bottom: 12%;
  width: 20rem;
  height: 20rem;
  background: rgba(20, 184, 166, 0.14);
}

.error-page__backdrop--right {
  top: 8%;
  right: -5rem;
  width: 18rem;
  height: 18rem;
  background: rgba(245, 158, 11, 0.16);
}

.error-page__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 42rem;
}

.error-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.8rem;
  padding: 1.6rem;
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.3);
  backdrop-filter: blur(18px);
}

.error-card__eyebrow {
  margin: 0 0 0.9rem;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.error-card__title {
  margin: 0;
  color: #f8f4ec;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.1rem, 7vw, 4rem);
  line-height: 0.98;
}

.error-card__description {
  margin: 1rem 0 0;
  color: rgba(226, 232, 240, 0.84);
  font-size: 1rem;
  line-height: 1.7;
}

.error-card__path {
  margin: 1.1rem 0 0;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.72);
  color: rgba(203, 213, 225, 0.88);
  font-size: 0.92rem;
}

.error-card__path span {
  display: inline-block;
  margin-top: 0.15rem;
  color: #f8f4ec;
  word-break: break-word;
}

.error-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.4rem;
}

.error-card__primary,
.error-card__secondary {
  min-height: 3.2rem;
  padding: 0.9rem 1.2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.error-card__primary {
  border: none;
  background: linear-gradient(180deg, #e0bd39, #d1a728);
  color: #17120a;
}

.error-card__secondary {
  border: 1px solid rgba(248, 244, 236, 0.2);
  background: rgba(15, 23, 42, 0.68);
  color: #f8f4ec;
}

@media (min-width: 768px) {
  .error-card {
    padding: 2rem;
  }
}
</style>
