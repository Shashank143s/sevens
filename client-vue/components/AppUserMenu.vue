<script setup lang="ts">
import UserAvatar from '~/components/UserAvatar.vue'

withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

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
  return first
})

const triggerEyebrow = computed(() => (isLoggedIn.value ? 'Account' : 'Ready to play?'))

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

function goToBlog() {
  open.value = false
  router.push('/blog')
}

function goToPrivacyPolicy() {
  open.value = false
  router.push('/privacy-policy')
}

function goToTerms() {
  open.value = false
  router.push('/terms-and-conditions')
}

async function login() {
  open.value = false
  if (router.currentRoute.value.path !== '/') {
    await router.push('/')
    await nextTick()
  }
  openAuth()
}

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <div v-if="showMenu" class="user-menu" :class="{ 'user-menu--compact': compact }">
    <button
      type="button"
      class="user-menu__toggle"
      :class="{ 'user-menu__toggle--open': open }"
      :aria-expanded="open ? 'true' : 'false'"
      @click="open = !open"
    >
      <span class="user-menu__copy">
        <span class="user-menu__eyebrow">{{ triggerEyebrow }}</span>
        <span class="user-menu__label">{{ displayName }}</span>
      </span>
      <UserAvatar
        v-if="isLoggedIn"
        class="user-menu__avatar"
        :name="session?.name"
        :image-src="session?.image"
      />
      <span
        class="user-menu__chevron"
        :class="{ 'user-menu__chevron--open': open }"
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </span>
    </button>

    <Transition name="user-menu-panel">
      <div v-if="open" class="user-menu__panel">
        <div class="user-menu__section">
          <p class="user-menu__section-label">{{ isLoggedIn ? 'Profile' : 'Start here' }}</p>
          <button
            v-if="!isLoggedIn"
            type="button"
            class="user-menu__action user-menu__action--login"
            @click="login"
          >
            <span>Login</span>
            <span class="user-menu__action-arrow">→</span>
          </button>
          <button
            v-if="isLoggedIn"
            type="button"
            class="user-menu__action user-menu__action--primary"
            @click="goToAccount"
          >
            <span>Account</span>
            <span class="user-menu__action-arrow">→</span>
          </button>
        </div>

        <div class="user-menu__section">
          <p class="user-menu__section-label">Explore</p>
          <button
            type="button"
            class="user-menu__action user-menu__action--neutral"
            @click="goToDownloads"
          >
            <span>Downloads</span>
          </button>
          <button
            type="button"
            class="user-menu__action user-menu__action--neutral"
            @click="goToInstructions"
          >
            <span>Instructions</span>
          </button>
          <button
            type="button"
            class="user-menu__action user-menu__action--neutral"
            @click="goToContact"
          >
            <span>Contact</span>
          </button>
          <button
            type="button"
            class="user-menu__action user-menu__action--neutral user-menu__action--desktop"
            @click="goToBlog"
          >
            <span>Blog</span>
          </button>
        </div>

        <div class="user-menu__section">
          <p class="user-menu__section-label">Legal</p>
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
  min-height: 3.6rem;
  padding: 0.55rem 0.8rem 0.55rem 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.12), transparent 42%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.82));
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(2, 6, 23, 0.24);
  backdrop-filter: blur(18px);
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.user-menu--compact .user-menu__toggle {
  min-height: 3rem;
  padding: 0.42rem 0.62rem 0.42rem 0.74rem;
  border-radius: 1rem;
  gap: 0.52rem;
}

.user-menu__toggle--open {
  border-color: rgba(212, 175, 55, 0.18);
  background:
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.16), transparent 42%),
    linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.92));
}

.user-menu__toggle:hover,
.user-menu__toggle:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(212, 175, 55, 0.2);
}

.user-menu__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.user-menu__eyebrow {
  color: rgba(250, 204, 21, 0.78);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1;
}

.user-menu--compact .user-menu__eyebrow {
  font-size: 0.56rem;
  letter-spacing: 0.14em;
}

.user-menu__label {
  margin-top: 0.18rem;
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
}

.user-menu--compact .user-menu__label {
  margin-top: 0.12rem;
  font-size: 0.82rem;
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

.user-menu--compact .user-menu__avatar {
  width: 2.05rem;
  height: 2.05rem;
  font-size: 0.9rem;
}

.user-menu__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  color: rgba(226, 232, 240, 0.72);
  transition: transform 0.18s ease, color 0.18s ease;
}

.user-menu--compact .user-menu__chevron {
  width: 0.9rem;
  height: 0.9rem;
}

.user-menu__chevron svg {
  width: 100%;
  height: 100%;
}

.user-menu__chevron--open {
  transform: rotate(180deg);
  color: #f8fafc;
}

.user-menu__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 81;
  min-width: 15rem;
  padding: 0.65rem;
  border-radius: 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.1), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.94));
  box-shadow: 0 28px 60px rgba(2, 6, 23, 0.38);
  backdrop-filter: blur(18px);
}

.user-menu--compact .user-menu__panel {
  min-width: 13.4rem;
  padding: 0.5rem;
  border-radius: 0.98rem;
}

.user-menu__section + .user-menu__section {
  margin-top: 0.65rem;
}

.user-menu--compact .user-menu__section + .user-menu__section {
  margin-top: 0.45rem;
}

.user-menu__section-label {
  margin: 0 0 0.45rem;
  padding: 0 0.45rem;
  color: rgba(148, 163, 184, 0.72);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.user-menu--compact .user-menu__section-label {
  margin: 0 0 0.28rem;
  padding: 0 0.3rem;
  font-size: 0.56rem;
}

.user-menu__action {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.72rem 0.85rem;
  border-radius: 0.85rem;
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.08);
  text-align: left;
  font-size: 0.88rem;
  font-weight: 700;
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
}

.user-menu--compact .user-menu__action {
  padding: 0.58rem 0.68rem;
  border-radius: 0.72rem;
  font-size: 0.79rem;
}

.user-menu__action + .user-menu__action {
  margin-top: 0.34rem;
}

.user-menu--compact .user-menu__action + .user-menu__action {
  margin-top: 0.26rem;
}

.user-menu__action:hover {
  background: rgba(148, 163, 184, 0.16);
  transform: translateY(-1px);
}

.user-menu__action--primary {
  color: #17120a;
  background: linear-gradient(180deg, #e0bd39, #d1a728);
  box-shadow: 0 12px 28px rgba(209, 167, 40, 0.18);
}

.user-menu__action--login {
  color: #17120a;
  background: linear-gradient(180deg, #e0bd39, #d1a728);
  box-shadow: 0 12px 28px rgba(209, 167, 40, 0.18);
}

.user-menu__action--primary:hover,
.user-menu__action--login:hover {
  background: linear-gradient(180deg, #ebc94f, #d9ad2f);
}

.user-menu__action-arrow {
  color: rgba(15, 23, 42, 0.72);
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

.user-menu--compact .user-menu__legal {
  gap: 0.28rem;
}

.user-menu__action--legal {
  font-size: 0.82rem;
  color: rgba(226, 232, 240, 0.8);
}

.user-menu--compact .user-menu__action--legal {
  font-size: 0.74rem;
}

@media (max-width: 767px) {
  .user-menu__action--desktop {
    display: none;
  }
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
    padding: 0.5rem 0.68rem 0.5rem 0.8rem;
    gap: 0.55rem;
  }

  .user-menu__eyebrow {
    font-size: 0.58rem;
  }

  .user-menu__label {
    font-size: 0.82rem;
  }

  .user-menu__avatar {
    width: 2.1rem;
    height: 2.1rem;
  }

  .user-menu__panel {
    min-width: 14rem;
    padding: 0.55rem;
  }
}
</style>
