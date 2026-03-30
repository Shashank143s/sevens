<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { useRoomCredentials } from '~/composables/useRoomCredentials'

const router = useRouter()
const { session, clearSession, hydrated } = usePlayerSession()
const { clearAllCredentials } = useRoomCredentials()
const { deleteAccount, getAccount } = useAccountApi()
const isDeleting = ref(false)
const isDeleteDialogOpen = ref(false)
const coinsBalance = ref<number | null>(null)
const playerLevel = ref<number | null>(null)
const xpTotal = ref<number | null>(null)
const mounted = ref(false)

const sessionReady = computed(() => mounted.value && hydrated.value)
const fullName = computed(() => (sessionReady.value ? session.value?.name?.trim() : '') || 'Player')
const email = computed(() => (sessionReady.value ? session.value?.email?.trim() : '') || 'Not available')
const profileImage = computed(() => (sessionReady.value ? session.value?.image : undefined))
const avatarLabel = computed(() => fullName.value.charAt(0).toUpperCase() || 'P')
const accountIdentifier = computed(() => (sessionReady.value ? session.value?.id || session.value?.email?.trim() : '') || '')
const lastLoginLabel = computed(() => (sessionReady.value ? formatDate(session.value?.lastLoginAt) : 'Not available'))
const levelProgress = computed(() => {
  const totalXp = Math.max(xpTotal.value ?? 0, 0)
  let level = 1
  let xpIntoLevel = totalXp
  let xpNeededForNextLevel = 100

  while (xpIntoLevel >= xpNeededForNextLevel) {
    xpIntoLevel -= xpNeededForNextLevel
    level += 1
    xpNeededForNextLevel += 50
  }

  return {
    level,
    xpIntoLevel,
    xpNeededForNextLevel,
    progressPercent: xpNeededForNextLevel > 0
      ? Math.min((xpIntoLevel / xpNeededForNextLevel) * 100, 100)
      : 0,
  }
})

function formatDate(value?: string | number) {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

function openDeleteDialog() {
  isDeleteDialogOpen.value = true
}

function closeDeleteDialog() {
  if (isDeleting.value) return
  isDeleteDialogOpen.value = false
}

async function confirmDeleteAccount() {
  if (!accountIdentifier.value) return
  isDeleting.value = true

  try {
    await deleteAccount(accountIdentifier.value)
    clearSession()
    clearAllCredentials()
    router.replace('/')
  } finally {
    isDeleting.value = false
    isDeleteDialogOpen.value = false
  }
}

function logout() {
  clearSession()
  clearAllCredentials()
  router.push('/')
}

async function loadAccountSummary() {
  if (!accountIdentifier.value) return
  try {
    const response = await getAccount(accountIdentifier.value, 0, 0)
    coinsBalance.value = response.user.wallet?.coins_balance ?? null
    playerLevel.value = response.user.progression?.level ?? null
    xpTotal.value = response.user.progression?.xp_total ?? null
  } catch {
    coinsBalance.value = null
    playerLevel.value = null
    xpTotal.value = null
  }
}

onMounted(() => {
  mounted.value = true
  if (!session.value?.name?.trim()) {
    router.replace('/')
    return
  }

  void loadAccountSummary()
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
        <div class="account-card__hero-shell">
          <div class="account-card__hero">
            <div class="account-card__identity">
              <p class="account-card__eyebrow">Player Account</p>
              <div class="account-card__identity-main">
                <h1>{{ fullName }}</h1>
                <p class="account-card__email">{{ email }}</p>
              </div>
              <p class="account-card__meta-line">
                <span class="account-card__meta-label">Last login</span>
                <strong>{{ lastLoginLabel }}</strong>
              </p>
            </div>

            <div class="account-card__avatar">
              <img
                v-if="profileImage"
                :src="profileImage"
                :alt="fullName"
                class="account-card__image"
              >
              <span v-else>{{ avatarLabel }}</span>
            </div>
          </div>
        </div>

        <section class="account-card__progression">
          <div class="account-card__progression-top">
            <div class="account-card__chip account-card__chip--coins">
              <IconsCoinIcon class="account-card__coin-icon" />
              <strong>{{ coinsBalance == null ? '—' : coinsBalance }}</strong>
            </div>
            <div class="account-card__chip account-card__chip--level">
              <span class="account-card__chip-label">Lv</span>
              <strong>{{ playerLevel ?? levelProgress.level }}</strong>
            </div>
          </div>
          <div class="account-card__xp">
            <div class="account-card__xp-header">
              <p class="account-card__economy-label">Level Progress</p>
              <span>{{ levelProgress.xpIntoLevel }} / {{ levelProgress.xpNeededForNextLevel }} XP</span>
            </div>
            <div class="account-card__xp-track" aria-hidden="true">
              <div class="account-card__xp-fill" :style="{ width: `${levelProgress.progressPercent}%` }" />
            </div>
          </div>
        </section>

        <section class="account-history">
          <div class="account-history__grid">
            <button
              type="button"
              class="account-history__link"
              @click="router.push('/account/games')"
            >
              <span class="account-history__title">Recent Games</span>
              <span class="account-history__arrow">→</span>
            </button>
            <button
              type="button"
              class="account-history__link"
              @click="router.push('/account/leaderboard')"
            >
              <span class="account-history__title">Leaderboard</span>
              <span class="account-history__arrow">→</span>
            </button>
          </div>
        </section>

        <div class="account-card__actions">
          <div class="account-card__row">
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
          <button
            type="button"
            class="account-card__danger"
            @click="openDeleteDialog"
          >
            Delete Account
          </button>
        </div>
      </section>
    </main>

    <div
      v-if="isDeleteDialogOpen"
      class="account-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div class="account-dialog__backdrop" @click="closeDeleteDialog" />
      <section class="account-dialog__panel">
        <p class="account-card__eyebrow">Confirm</p>
        <h2 id="delete-account-title">Delete your account?</h2>
        <p class="account-dialog__copy">
          This will deactivate your account and sign you out of Sevens Royale on this device.
        </p>

        <div class="account-dialog__actions">
          <button
            type="button"
            class="account-card__secondary"
            :disabled="isDeleting"
            @click="closeDeleteDialog"
          >
            Cancel
          </button>
          <button
            type="button"
            class="account-card__danger"
            :disabled="isDeleting"
            @click="confirmDeleteAccount"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete Account' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.account-page {
  position: relative;
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
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.8rem;
  background: rgba(15, 23, 42, 0.74);
  box-shadow: 0 22px 55px rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(18px);
  padding: 1.4rem;
}

.account-card__hero-shell {
  margin: -1.4rem -1.4rem 0;
  padding: 1.1rem 1.4rem 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 28%),
    radial-gradient(circle at left center, rgba(250, 204, 21, 0.14), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.account-card__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  background:
    radial-gradient(circle at top, rgba(250, 204, 21, 0.22), transparent 46%),
    rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 18px 36px rgba(2, 6, 23, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  font-size: 1.75rem;
  font-weight: 800;
  color: #f8f4ec;
}

.account-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-card__identity {
  min-width: 0;
  flex: 1;
}

.account-card__identity-main {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.account-card__identity h1 {
  margin: 0;
  font-size: clamp(1.45rem, 4vw, 2.2rem);
  line-height: 1;
  color: #f8f4ec;
  text-shadow: 0 8px 22px rgba(2, 6, 23, 0.18);
}

.account-card__email {
  margin: 0;
  color: rgba(191, 219, 254, 0.72);
  font-size: 0.98rem;
}

.account-card__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.account-card__meta-line {
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin: 0.9rem 0 0;
}

.account-card__meta-label {
  color: rgba(148, 163, 184, 0.8);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.account-card__meta-line strong {
  color: #f8fafc;
  font-size: 0.78rem;
  line-height: 1;
}

.account-card__progression {
  margin-top: 1.1rem;
  padding: 1rem 1.05rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.72));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 40px rgba(2, 6, 23, 0.2);
}

.account-card__progression-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.account-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.7rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.account-card__chip strong {
  font-size: 1rem;
  font-weight: 900;
  line-height: 1;
}

.account-card__chip--coins {
  border-color: rgba(250, 204, 21, 0.2);
}

.account-card__chip--coins strong {
  color: #fde68a;
}

.account-card__chip--level {
  border-color: rgba(96, 165, 250, 0.18);
}

.account-card__chip--level strong {
  color: #dbeafe;
}

.account-card__chip-label {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(191, 219, 254, 0.82);
}

.account-card__coin-icon {
  width: 1rem;
  height: 1rem;
}

.account-card__xp {
  margin-top: 0.95rem;
}

.account-card__xp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
  flex-wrap: wrap;
}

.account-card__xp-header span {
  color: rgba(226, 232, 240, 0.74);
  font-size: 0.85rem;
  font-weight: 700;
}

.account-card__xp-track {
  overflow: hidden;
  width: 100%;
  height: 0.7rem;
  border-radius: 999px;
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.account-card__xp-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #facc15);
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.26);
}

.account-card__economy {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
}

.account-card__economy-label {
  margin: 0;
  color: rgba(203, 213, 225, 0.78);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.account-card__actions {
  display: grid;
  gap: 0.85rem;
  margin-top: 1.5rem;
}

.account-history {
  margin-top: 1.6rem;
  padding: 0.45rem;
  border-radius: 1.35rem;
  background: rgba(15, 23, 42, 0.52);
  border: 1px solid rgba(245, 158, 11, 0.12);
}

.account-history__grid {
  display: grid;
  gap: 0.55rem;
}

.account-history__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-height: 4.25rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: radial-gradient(circle at left center, rgba(250, 204, 21, 0.08), transparent 45%);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.account-history__link:hover {
  background-color: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.account-history__title {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: #f8f4ec;
}

.account-history__arrow {
  font-size: 1.7rem;
  color: #facc15;
}

.account-card__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
}

.account-card__secondary,
.account-card__logout,
.account-card__danger {
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
  white-space: nowrap;
}

.account-card__danger {
  width: 100%;
  background: rgba(153, 27, 27, 0.92);
  border: 1px solid rgba(252, 165, 165, 0.4);
  color: #fff1f2;
}

.account-card__logout {
  min-height: 2.85rem;
  padding: 0.7rem 1rem;
  background: rgba(127, 29, 29, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.22);
  color: #fecaca;
}

.account-dialog {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.account-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(8px);
}

.account-dialog__panel {
  position: relative;
  width: min(100%, 28rem);
  padding: 1.4rem;
  border-radius: 1.5rem;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(248, 113, 113, 0.16);
  box-shadow: 0 24px 55px rgba(2, 6, 23, 0.45);
}

.account-dialog__panel h2 {
  margin: 0.35rem 0 0;
  color: #f8f4ec;
}

.account-dialog__copy {
  margin: 0.9rem 0 0;
  line-height: 1.65;
  color: rgba(203, 213, 225, 0.86);
}

.account-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.25rem;
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

  .account-card__hero-shell {
    margin: -1.8rem -1.8rem 0;
    padding: 1.2rem 1.8rem 1.3rem;
  }
}

@media (max-width: 640px) {
  .account-card__hero-shell {
    margin: -1.4rem -1.4rem 0;
  }

  .account-card__hero {
    align-items: flex-start;
  }

  .account-card__avatar {
    width: 4.6rem;
    height: 4.6rem;
  }

  .account-card__xp-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
