<script setup lang="ts">
const router = useRouter()
const { session, hydrated } = usePlayerSession()
const { openAuth } = useGoogleLogin()

const open = ref(false)
const mounted = ref(false)
const showMenu = computed(() => mounted.value && hydrated.value)
const isLoggedIn = computed(() => !!session.value)

const displayName = computed(() => {
  if (!isLoggedIn.value) return 'Login'
  const name = session.value?.name?.trim() ?? 'Player'
  const first = name.split(/\s+/)[0]
  return `Welcome, ${first}`
})

const avatarLabel = computed(() => {
  if (!isLoggedIn.value) return '↗'
  return session.value?.avatar ?? '🐶'
})

function goToInstructions() {
  open.value = false
  router.push('/instructions')
}

function goToAccount() {
  open.value = false
  router.push('/account')
}

function goToDownloads() {
  open.value = false
  router.push('/downloads')
}

function goToContact() {
  open.value = false
  router.push('/contact')
}

function goToPrivacyPolicy() {
  open.value = false
  router.push('/privacy-policy')
}

function goToTerms() {
  open.value = false
  router.push('/terms-and-conditions')
}

function login() {
  open.value = false
  openAuth()
}

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <div v-if="showMenu" class="user-menu">
    <button
      type="button"
      class="user-menu__toggle"
      :class="{ 'user-menu__toggle--open': open }"
      :aria-expanded="open ? 'true' : 'false'"
      @click="open = !open"
    >
      <span class="user-menu__label">{{ displayName }}</span>
      <span class="user-menu__avatar">
        <img
          v-if="isLoggedIn && session?.image"
          :src="session.image"
          :alt="session.name"
          class="user-menu__image"
        >
        <span v-else>{{ avatarLabel }}</span>
      </span>
    </button>

    <Transition name="user-menu-panel">
      <div v-if="open" class="user-menu__panel">
        <button
          v-if="!isLoggedIn"
          type="button"
          class="user-menu__action user-menu__action--login"
          @click="login"
        >
          Login
        </button>
        <button
          v-if="isLoggedIn"
          type="button"
          class="user-menu__action user-menu__action--neutral"
          @click="goToAccount"
        >
          Account
        </button>
        <button
          type="button"
          class="user-menu__action user-menu__action--neutral user-menu__action--download"
          @click="goToDownloads"
        >
          <span>Downloads</span>
        </button>
        <button
          type="button"
          class="user-menu__action user-menu__action--neutral"
          @click="goToInstructions"
        >
          Instructions
        </button>
        <button
          type="button"
          class="user-menu__action user-menu__action--neutral"
          @click="goToContact"
        >
          Contact Us
        </button>
        <div class="user-menu__divider" />
        <div class="user-menu__legal">
          <button
            type="button"
            class="user-menu__action user-menu__action--neutral user-menu__action--legal"
            @click="goToPrivacyPolicy"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            class="user-menu__action user-menu__action--neutral user-menu__action--legal"
            @click="goToTerms"
          >
            Terms &amp; Conditions
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
  z-index: 80;
}

.user-menu__toggle {
  min-height: 3.5rem;
  padding: 0.65rem 0.8rem 0.65rem 1rem;
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 1.15rem;
  background: rgba(15, 23, 42, 0.84);
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.3);
  backdrop-filter: blur(16px);
}

.user-menu__toggle--open {
  background: rgba(30, 41, 59, 0.96);
}

.user-menu__label {
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.user-menu__avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  font-size: 1.05rem;
}

.user-menu__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-menu__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 81;
  min-width: 10rem;
  padding: 0.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(245, 158, 11, 0.14);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
  box-shadow: 0 22px 48px rgba(2, 6, 23, 0.34);
  backdrop-filter: blur(16px);
}

.user-menu__action {
  width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.7rem;
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.12);
  text-align: left;
  font-size: 0.88rem;
  font-weight: 700;
}

.user-menu__action + .user-menu__action {
  margin-top: 0.4rem;
}

.user-menu__action:hover {
  background: rgba(148, 163, 184, 0.2);
}

.user-menu__action--download {
  color: #dcfce7;
}

.user-menu__action--login {
  color: #17120a;
  background: linear-gradient(180deg, #e0bd39, #d1a728);
}

.user-menu__divider {
  height: 1px;
  margin: 0.55rem 0;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.3), transparent);
}

.user-menu__legal {
  display: grid;
  gap: 0.4rem;
}

.user-menu__action--legal {
  font-size: 0.82rem;
  color: rgba(226, 232, 240, 0.8);
}

.user-menu-panel-enter-active,
.user-menu-panel-leave-active {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
  transform-origin: top right;
}

.user-menu-panel-enter-from,
.user-menu-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.user-menu-panel-enter-to,
.user-menu-panel-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (max-width: 640px) {
  .user-menu__toggle {
    min-height: 3.15rem;
    padding: 0.55rem 0.7rem 0.55rem 0.85rem;
    gap: 0.65rem;
  }

  .user-menu__label {
    font-size: 0.82rem;
  }

  .user-menu__avatar {
    width: 2.1rem;
    height: 2.1rem;
  }
}
</style>
