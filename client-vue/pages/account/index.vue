<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { useRoomCredentials } from '~/composables/useRoomCredentials'

const router = useRouter()
const { session, clearSession } = usePlayerSession()
const { clearAllCredentials } = useRoomCredentials()
const { deleteAccount, getAccount } = useAccountApi()
const isDeleting = ref(false)
const isDeleteDialogOpen = ref(false)
const remainingRooms = ref<number | null>(null)

const fullName = computed(() => session.value?.name?.trim() || 'Player')
const email = computed(() => session.value?.email?.trim() || 'Not available')
const profileImage = computed(() => session.value?.image)
const avatarLabel = computed(() => fullName.value.charAt(0).toUpperCase() || 'P')
const accountIdentifier = computed(() => session.value?.id || session.value?.email?.trim() || '')
const lastLoginLabel = computed(() => formatDate(session.value?.lastLoginAt))

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

async function loadAccountQuota() {
  if (!accountIdentifier.value) return
  try {
    const response = await getAccount(accountIdentifier.value, 0, 0)
    remainingRooms.value = response.user.remaining_rooms
  } catch {
    remainingRooms.value = null
  }
}

onMounted(() => {
  if (!session.value?.name?.trim()) {
    router.replace('/')
    return
  }

  void loadAccountQuota()
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
              v-if="profileImage"
              :src="profileImage"
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

        <p class="account-card__last-login">
          Last login: <strong>{{ lastLoginLabel }}</strong>
        </p>
        <section class="account-card__quota">
          <div>
            <p class="account-card__quota-label">Remaining games today</p>
            <p class="account-card__quota-copy">Fresh room creations left in your UTC daily quota.</p>
          </div>
          <div class="account-card__quota-value">
            {{ remainingRooms == null ? '—' : remainingRooms }}
          </div>
        </section>

        <section class="account-history">
          <button
            type="button"
            class="account-history__link"
            @click="router.push('/account/games')"
          >
            <span class="account-history__title">Recent Games</span>
            <span class="account-history__arrow">→</span>
          </button>
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
  font-size: clamp(1.45rem, 4vw, 2.2rem);
  line-height: 1;
  color: #f8f4ec;
}

.account-card__identity p:last-child {
  margin: 0.55rem 0 0;
  color: rgba(203, 213, 225, 0.82);
}

.account-card__last-login {
  margin: 1rem 0 0;
  color: rgba(203, 213, 225, 0.82);
  font-size: 0.95rem;
}

.account-card__last-login strong {
  color: #f8fafc;
}

.account-card__quota {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(250, 204, 21, 0.16);
  background:
    radial-gradient(circle at left center, rgba(250, 204, 21, 0.16), transparent 52%),
    linear-gradient(135deg, rgba(120, 53, 15, 0.22), rgba(15, 23, 42, 0.88));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 40px rgba(2, 6, 23, 0.22);
}

.account-card__quota-label {
  margin: 0;
  color: #fde68a;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.account-card__quota-copy {
  margin: 0.45rem 0 0;
  color: rgba(226, 232, 240, 0.74);
  font-size: 0.9rem;
  line-height: 1.45;
  max-width: 20rem;
}

.account-card__quota-value {
  min-width: 4.2rem;
  padding: 0.8rem 0.95rem;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(250, 204, 21, 0.24);
  color: #fef3c7;
  font-size: 1.7rem;
  font-weight: 900;
  line-height: 1;
  text-align: center;
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.22);
}

.account-card__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.22em;
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
}

@media (max-width: 640px) {
  .account-card__quota {
    align-items: flex-start;
    flex-direction: column;
  }

  .account-card__quota-value {
    min-width: 3.6rem;
  }
}
</style>
