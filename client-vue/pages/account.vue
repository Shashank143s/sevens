<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { useRoomCredentials } from '~/composables/useRoomCredentials'

const router = useRouter()
const { session, clearSession } = usePlayerSession()
const { clearAllCredentials } = useRoomCredentials()

const fullName = computed(() => session.value?.name?.trim() || 'Player')
const email = computed(() => session.value?.email?.trim() || 'Not available')
const avatarLabel = computed(() => fullName.value.charAt(0).toUpperCase() || 'P')
const lastLoginLabel = computed(() => {
  const timestamp = session.value?.lastLoginAt
  if (!timestamp) return 'Not available'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(timestamp))
})

function logout() {
  clearSession()
  clearAllCredentials()
  router.push('/')
}

onMounted(() => {
  if (!session.value?.name?.trim()) {
    router.replace('/')
  }
})
</script>

<template>
  <div
    class="account-page"
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.92)), url(${backgroundGame})` }"
  >
    <header class="account-page__header">
      <NuxtLink to="/" class="account-page__back">
        ← Home
      </NuxtLink>
      <AppUserMenu />
    </header>

    <main class="account-page__content">
      <section class="account-card">
        <div class="account-card__hero">
          <div class="account-card__avatar">
            <img
              v-if="session?.image"
              :src="session.image"
              :alt="fullName"
              class="account-card__image"
            >
            <span v-else>{{ avatarLabel }}</span>
          </div>

          <div class="account-card__identity">
            <p class="account-card__eyebrow">Account</p>
            <h1>{{ fullName }}</h1>
            <p>{{ email }}</p>
          </div>
        </div>

        <div class="account-grid">
          <article class="account-detail">
            <span class="account-detail__label">Full name</span>
            <strong>{{ fullName }}</strong>
          </article>

          <article class="account-detail">
            <span class="account-detail__label">Email</span>
            <strong>{{ email }}</strong>
          </article>

          <article class="account-detail">
            <span class="account-detail__label">Last login</span>
            <strong>{{ lastLoginLabel }}</strong>
          </article>
        </div>

        <div class="account-card__actions">
          <NuxtLink to="/instructions" class="account-card__secondary">
            View Instructions
          </NuxtLink>
          <button
            type="button"
            class="account-card__logout"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.account-page {
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

.account-page__header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.account-page__back {
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  font-weight: 700;
}

.account-page__content {
  width: 100%;
  max-width: 52rem;
  margin: 0 auto;
}

.account-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.8rem;
  background: rgba(15, 23, 42, 0.74);
  box-shadow: 0 22px 55px rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(18px);
  padding: 1.4rem;
}

.account-card__hero {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.account-card__avatar {
  width: 5.25rem;
  height: 5.25rem;
  border-radius: 1.4rem;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 1.75rem;
  font-weight: 800;
  color: #f8f4ec;
}

.account-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-card__identity h1 {
  margin: 0.2rem 0 0;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  line-height: 1;
  color: #f8f4ec;
}

.account-card__identity p:last-child {
  margin: 0.55rem 0 0;
  color: rgba(203, 213, 225, 0.82);
}

.account-card__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.account-grid {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.4rem;
}

.account-detail {
  padding: 1rem 1.05rem;
  border-radius: 1.2rem;
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(245, 158, 11, 0.12);
}

.account-detail__label {
  display: block;
  margin-bottom: 0.45rem;
  color: rgba(148, 163, 184, 0.88);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.account-detail strong {
  color: #f8fafc;
  font-size: 1rem;
  line-height: 1.5;
}

.account-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.5rem;
}

.account-card__secondary,
.account-card__logout {
  min-height: 3.25rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.account-card__secondary {
  background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #f8fafc;
}

.account-card__logout {
  background: rgba(127, 29, 29, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.22);
  color: #fecaca;
}

@media (min-width: 768px) {
  .account-page {
    padding:
      max(1.75rem, env(safe-area-inset-top))
      max(1.5rem, env(safe-area-inset-right))
      max(2.5rem, env(safe-area-inset-bottom))
      max(1.5rem, env(safe-area-inset-left));
  }

  .account-card {
    padding: 1.8rem;
  }

  .account-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
