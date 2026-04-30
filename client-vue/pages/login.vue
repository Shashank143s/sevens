<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { isCompact } = useUiDensity()
const { setCrawlerSessionValid, verifyCrawlerSession } = useCrawlerSession()
const { setSession } = usePlayerSession();
const username = ref('')
const password = ref('')
const loading = ref(false)
const statusMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const canonicalUrl = computed(() => new URL(route.path || '/login-crawler', config.public.siteUrl).toString())
const redirectTarget = computed(() => {
  const raw = route.query.redirect
  return typeof raw === 'string' && raw.trim() ? raw : '/lobby'
})

useHead(() => ({
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

useSeoMeta({
  title: 'Login',
  description: 'login page for Sevens Royale app.',
  ogTitle: 'Login - Sevens Royale',
  ogDescription: 'login page for Sevens Royale app.',
  ogUrl: canonicalUrl,
  robots: 'noindex, nofollow',
})

async function submitLogin() {
  if (loading.value) return
  loading.value = true
  statusMessage.value = null
  errorMessage.value = null

  try {
    const response = await $fetch<{ ok?: boolean; expires_at?: string }>(`${config.public.apiBase}/api/login`, {
      method: 'POST',
      credentials: 'include',
      body: {
        username: username.value.trim(),
        password: password.value,
      },
    })

    statusMessage.value = response.expires_at
      ? `Login cookie issued. Expires ${new Date(response.expires_at).toLocaleString()}.`
      : 'Login cookie issued.'
    setCrawlerSessionValid(true)
    await verifyCrawlerSession(true)
    setSession({
      id: "69f2764d04b5d68089da00ed",
      name: 'Crawler Access',
      avatar: '🐶',
      image: '',
      email: 'crawler.access@gmail.com',
      lastLoginAt: Date.now(),
    })
    await router.replace(redirectTarget.value)
  } catch (error: any) {
    console.error('[crawler-login] Login failed:', error)
    errorMessage.value = error?.data?.error || 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ClientOnly>
  <div
    class="login-page"
    :class="{ 'login-page--compact': isCompact }"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/" back-label="Home" />

    <main class="login-page__content">
      <section class="login-card login-card--hero">
        <p class="login-card__eyebrow">Authenticate</p>
        <h1>Sign in</h1>
      </section>

      <section class="login-card">
        <form class="login-form" @submit.prevent="submitLogin">
          <label class="login-field">
            <span>Username</span>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              required
              class="login-input"
              placeholder="Crawler username"
            >
          </label>

          <label class="login-field">
            <span>Password</span>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="login-input"
              placeholder="Crawler password"
            >
          </label>

          <button
            type="submit"
            class="login-button"
            :disabled="loading"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p v-if="errorMessage" class="login-status login-status--error">
          {{ errorMessage }}
        </p>

      </section>
    </main>
  </div>
</ClientOnly>
</template>

<style scoped>
.login-page {
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

.login-page__content {
  width: 100%;
  max-width: 42rem;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.login-card {
  padding: 1.25rem 1.3rem;
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.76);
  box-shadow: 0 20px 48px rgba(2, 6, 23, 0.26);
  backdrop-filter: blur(16px);
}

.login-card--hero {
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 28%),
    radial-gradient(circle at left center, rgba(250, 204, 21, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96));
}

.login-card__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.login-card h1 {
  margin: 0.45rem 0 0;
  color: #f8f4ec;
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  line-height: 1;
}

.login-card__lede {
  margin: 0.75rem 0 0;
  color: rgba(226, 232, 240, 0.8);
  line-height: 1.75;
}

.login-form {
  display: grid;
  gap: 0.9rem;
}

.login-field {
  display: grid;
  gap: 0.45rem;
}

.login-field span {
  color: rgba(203, 213, 225, 0.88);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-input {
  width: 100%;
  min-height: 3rem;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  outline: none;
}

.login-input:focus {
  border-color: rgba(250, 204, 21, 0.35);
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.12);
}

.login-button {
  min-height: 3.1rem;
  border-radius: 0.95rem;
  border: 0;
  background: #facc15;
  color: #0f172a;
  font-weight: 800;
}

.login-button:disabled {
  opacity: 0.72;
}

.login-status {
  margin: 0.9rem 0 0;
  padding: 0.85rem 1rem;
  border-radius: 0.95rem;
  line-height: 1.5;
}

.login-status--success {
  border: 1px solid rgba(52, 211, 153, 0.22);
  background: rgba(16, 185, 129, 0.12);
  color: #d1fae5;
}

.login-status--error {
  border: 1px solid rgba(248, 113, 113, 0.22);
  background: rgba(153, 27, 27, 0.18);
  color: #fecaca;
}

.login-note {
  margin: 0.9rem 0 0;
  color: rgba(203, 213, 225, 0.72);
  font-size: 0.88rem;
}
</style>
