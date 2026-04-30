<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import DeleteAccountModal from '~/components/DeleteAccountModal.vue'
import AdMobBottomBanner from '~/components/AdMobBottomBanner.vue'
import PermissionsModal from '~/components/PermissionsModal.vue'
import UserAvatar from '~/components/UserAvatar.vue'
import { useAppSource } from '~/composables/useAppSource'

const router = useRouter()
const { session, hydrated } = usePlayerSession()
const { clearAllCredentials } = useRoomCredentials()
const { deleteAccount, getAccountSummary } = useAccountApi()
const { signOut } = useGoogleLogin()
const admob = useAdMob()
const { isWebApp } = useAppSource()
const { isCompact, layout } = useUiDensity()
const isDeleting = ref(false)
const isDeleteDialogOpen = ref(false)
const isPermissionsDialogOpen = ref(false)
const countryName = ref<string>('Not available')
const mounted = ref(false)
const isInterstitialNavigating = ref(false)

const sessionReady = computed(() => mounted.value && hydrated.value)
const fullName = computed(() => (sessionReady.value ? session.value?.name?.trim() : '') || 'Player')
const email = computed(() => (sessionReady.value ? session.value?.email?.trim() : '') || 'Not available')
const profileImage = computed(() => (sessionReady.value ? session.value?.image : undefined))
const accountIdentifier = computed(() => (sessionReady.value ? session.value?.id || session.value?.email?.trim() : '') || '')
const lastLoginLabel = computed(() => (sessionReady.value ? formatDate(session.value?.lastLoginAt) : 'Not available'))

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

function openPermissionsDialog() {
  isPermissionsDialogOpen.value = true
}

function closePermissionsDialog() {
  isPermissionsDialogOpen.value = false
}

async function confirmDeleteAccount() {
  if (!accountIdentifier.value) return
  isDeleting.value = true

  try {
    await deleteAccount(accountIdentifier.value)
    await signOut()
    clearAllCredentials()
    router.replace('/')
  } finally {
    isDeleting.value = false
    isDeleteDialogOpen.value = false
  }
}

async function logout() {
  await signOut()
  clearAllCredentials()
  router.push('/')
}

async function loadAccountSummary() {
  if (!accountIdentifier.value) return
  try {
    const response = await getAccountSummary(accountIdentifier.value)
    countryName.value = response.user.location?.country_name
      || response.user.location?.country_code
      || 'Not available'
  } catch {
    countryName.value = 'Not available'
  }
}

async function goToAccountSection(path: string) {
  if (isInterstitialNavigating.value) return
  isInterstitialNavigating.value = true

  try {
    if (admob.canUseAdMob.value) {
      await admob.showInterstitial().catch((error) => {
        console.error('[account-page] Failed to show interstitial ad:', error)
      })
    }

    await router.push(path)
  } finally {
    isInterstitialNavigating.value = false
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
    :class="{ 'account-page--compact': isCompact }"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/" back-label="Home" />

    <main class="account-page__content">
      <section class="account-card">
        <div class="account-card__hero-shell">
          <div class="account-card__hero">
            <div class="account-card__identity">
              <p class="account-card__eyebrow">Player Account</p>
              <div class="account-card__identity-main">
                <h1>{{ fullName }}</h1>
              </div>
            </div>

            <UserAvatar
              class="account-card__avatar"
              :name="fullName"
              :image-src="profileImage"
            />
          </div>
        </div>

        <section class="account-history">
          <div class="account-history__grid">
            <div class="account-history__info-row">
              <span class="account-history__info-label">Email</span>
              <span class="account-history__info-value">{{ email }}</span>
            </div>
            <div class="account-history__info-row">
              <span class="account-history__info-label">Last login</span>
              <span class="account-history__info-value">{{ lastLoginLabel }}</span>
            </div>
            <div class="account-history__info-row">
              <span class="account-history__info-label">Country</span>
              <span class="account-history__info-value">{{ countryName }}</span>
            </div>
            <div v-if="isWebApp" class="account-history__info-row account-history__info-row--layout">
              <span class="account-history__info-label">Appearance</span>
              <label class="account-history__layout-control">
                <select v-model="layout" class="account-history__layout-select">
                  <option value="cozy">Cozy</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              class="account-history__link"
              :disabled="isInterstitialNavigating"
              @click="goToAccountSection('/account/profile')"
            >
              <span class="account-history__title">Profile</span>
              <IconsDirectionalArrowIcon class="account-history__arrow" />
            </button>
            <button
              type="button"
              class="account-history__link"
              :disabled="isInterstitialNavigating"
              @click="goToAccountSection('/account/leaderboard')"
            >
              <span class="account-history__title">Leaderboard</span>
              <IconsDirectionalArrowIcon class="account-history__arrow" />
            </button>
            <NuxtLink
              to="/privacy-policy"
              class="account-history__link"
            >
              <span class="account-history__title">Privacy Policy</span>
              <IconsDirectionalArrowIcon class="account-history__arrow" />
            </NuxtLink>
            <NuxtLink
              to="/terms-and-conditions"
              class="account-history__link"
            >
              <span class="account-history__title">Terms &amp; Conditions</span>
              <IconsDirectionalArrowIcon class="account-history__arrow" />
            </NuxtLink>
          </div>
        </section>

        <div class="account-card__actions">
          <div class="account-card__row">
            <NuxtLink v-if="isWebApp" to="/instructions" class="account-card__secondary">
              Instructions
            </NuxtLink>
            <button
              v-else
              type="button"
              class="account-card__secondary"
              @click="openPermissionsDialog"
            >
              Permissions
            </button>
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

    <AdMobBottomBanner />

    <DeleteAccountModal
      :open="isDeleteDialogOpen"
      :deleting="isDeleting"
      @close="closeDeleteDialog"
      @confirm="confirmDeleteAccount"
    />

    <PermissionsModal
      :open="isPermissionsDialogOpen"
      @close="closePermissionsDialog"
    />
  </div>
</template>

<style scoped>
.account-page {
  box-sizing: border-box;
  position: relative;
  min-height: 100dvh;
  height: 100dvh;
  overflow-y: auto;
  padding:
    max(1.25rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    calc(max(2rem, env(safe-area-inset-bottom)) + 96px)
    max(1rem, env(safe-area-inset-left));
  color: #f8fafc;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.4);
}

.account-page__header {
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

.account-page__back {
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

.account-page__back:hover,
.account-page__back:focus-visible {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(212, 175, 55, 0.22);
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
  font-size: clamp(1.7rem, 4vw, 2.2rem);
  font-weight: 300;
  letter-spacing: 0.1rem;
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
  padding: 0.85rem 1.05rem 1rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.12), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.72));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 40px rgba(2, 6, 23, 0.2);
}

.account-card__progression-toggle {
  display: block;
  width: 100%;
}

.account-card__progression-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: nowrap;
}

.account-card__progression-controls {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: nowrap;
  flex-shrink: 0;
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

.account-card__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.54);
  color: rgba(226, 232, 240, 0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.account-card__chevron svg {
  width: 0.9rem;
  height: 0.9rem;
}

.account-card__chevron--open {
  transform: rotate(180deg);
  background: rgba(30, 41, 59, 0.82);
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

.account-progress-expand-enter-active,
.account-progress-expand-leave-active {
  transition: opacity 0.18s ease, transform 0.22s ease;
  transform-origin: top center;
}

.account-progress-expand-enter-from,
.account-progress-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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

.account-history__info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  min-height: 3rem;
  padding: 0.62rem 0.95rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.account-history__info-label {
  color: rgba(203, 213, 225, 0.88);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.account-history__info-value {
  color: #f8fafc;
  font-size: 0.84rem;
  font-weight: 700;
  text-align: right;
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.account-history__link:disabled {
  cursor: not-allowed;
  opacity: 0.72;
  transform: none;
}

.account-history__title {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: #f8f4ec;
}

.account-history__arrow {
  color: #facc15;
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

.account-history__info-row--layout {
  align-items: center;
  justify-content: space-between;
}

.account-history__layout-control {
  position: relative;
  margin-left: auto;
  flex: 0 0 auto;
  display: block;
  width: max-content;
}

.account-history__layout-control::after {
  content: '';
  position: absolute;
  right: 0.95rem;
  top: 50%;
  width: 0.58rem;
  height: 0.58rem;
  border-right: 2px solid rgba(250, 204, 21, 0.9);
  border-bottom: 2px solid rgba(250, 204, 21, 0.9);
  transform: translateY(-65%) rotate(45deg);
  pointer-events: none;
}

.account-history__layout-select {
  width: 7.4rem;
  min-height: 2.55rem;
  padding: 0.62rem 2.15rem 0.62rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background:
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.12), transparent 42%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.94));
  color: #f8fafc;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-align: right;
  text-align-last: right;
  direction: rtl;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 10px 24px rgba(2, 6, 23, 0.18);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  outline: none;
}

.account-history__layout-select:focus-visible {
  border-color: rgba(212, 175, 55, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 0 0 3px rgba(212, 175, 55, 0.12),
    0 10px 24px rgba(2, 6, 23, 0.18);
}

.account-history__layout-select option {
  direction: ltr;
  background: #0f172a;
  color: #f8fafc;
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

:global(html.ui-density-compact) .account-page {
  padding:
    max(1rem, env(safe-area-inset-top))
    max(0.85rem, env(safe-area-inset-right))
    calc(max(1.5rem, env(safe-area-inset-bottom)) + 96px)
    max(0.85rem, env(safe-area-inset-left));
}

:global(html.ui-density-compact) .account-card {
  border-radius: 1.45rem;
  padding: 1.12rem;
}

:global(html.ui-density-compact) .account-card__hero-shell {
  margin: -1.12rem -1.12rem 0;
  padding: 0.95rem 1.12rem 1rem;
}

:global(html.ui-density-compact) .account-history__link {
  min-height: 4.35rem;
  padding: 0.9rem 1rem;
}

:global(html.ui-density-compact) .account-card__secondary,
:global(html.ui-density-compact) .account-card__logout,
:global(html.ui-density-compact) .account-card__danger {
  min-height: 2.95rem;
}

.account-page--compact {
  padding:
    max(0.85rem, env(safe-area-inset-top))
    max(0.65rem, env(safe-area-inset-right))
    calc(max(1.2rem, env(safe-area-inset-bottom)) + 96px)
    max(0.65rem, env(safe-area-inset-left));
}

.account-page--compact .account-page__content {
  max-width: 56rem;
}

.account-page--compact .account-card {
  border-radius: 1.45rem;
  padding: 0.95rem;
}

.account-page--compact .account-card__hero-shell {
  margin: -0.95rem -0.95rem 0;
  padding: 0.78rem 0.95rem 0.82rem;
}

.account-page--compact .account-card__hero {
  gap: 0.72rem;
}

.account-page--compact .account-card__avatar {
  width: 4.15rem;
  height: 4.15rem;
  border-radius: 1.08rem;
}

.account-page--compact .account-card__eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.18em;
}

.account-page--compact .account-card__identity-main {
  margin-top: 0.52rem;
  gap: 0.2rem;
}

.account-page--compact .account-card__identity h1 {
  font-size: clamp(1.6rem, 3.2vw, 1.72rem);
}

.account-page--compact .account-card__email {
  font-size: 0.82rem;
}

.account-page--compact .account-card__meta-line {
  margin-top: 0.62rem;
}

.account-page--compact .account-card__meta-label {
  font-size: 0.54rem;
}

.account-page--compact .account-card__meta-line strong {
  font-size: 0.7rem;
}

.account-page--compact .account-card__progression {
  margin-top: 0.72rem;
  border-radius: 1rem;
  padding: 0.64rem 0.72rem 0.74rem;
}

.account-page--compact .account-card__progression-controls {
  gap: 0.5rem;
}

.account-page--compact .account-card__chip {
  min-height: 2.2rem;
  padding: 0.4rem 0.62rem;
  gap: 0.42rem;
}

.account-page--compact .account-card__chip strong {
  font-size: 0.85rem;
}

.account-page--compact .account-card__chip-label {
  font-size: 0.62rem;
}

.account-page--compact .account-card__coin-icon {
  width: 0.84rem;
  height: 0.84rem;
}

.account-page--compact .account-card__chevron {
  width: 1.82rem;
  height: 1.82rem;
}

.account-page--compact .account-card__chevron svg {
  width: 0.74rem;
  height: 0.74rem;
}

.account-page--compact .account-card__xp {
  margin-top: 0.68rem;
}

.account-page--compact .account-card__xp-header {
  margin-bottom: 0.44rem;
}

.account-page--compact .account-card__xp-header span {
  font-size: 0.74rem;
}

.account-page--compact .account-card__xp-track {
  height: 0.58rem;
}

.account-page--compact .account-history {
  margin-top: 1rem;
  padding: 0.32rem;
  border-radius: 1rem;
}

.account-page--compact .account-history__grid {
  gap: 0.38rem;
}

.account-page--compact .account-history__info-row {
  min-height: 2.45rem;
  border-radius: 0.72rem;
  padding: 0.46rem 0.72rem;
  gap: 0.6rem;
}

.account-page--compact .account-history__info-label {
  font-size: 0.66rem;
  letter-spacing: 0.06em;
}

.account-page--compact .account-history__info-value {
  font-size: 0.72rem;
}

.account-page--compact .account-history__layout-control {
  width: max-content;
}

.account-page--compact .account-history__layout-select {
  width: 6.6rem;
  min-height: 2.25rem;
  padding: 0.48rem 1.9rem 0.48rem 0.68rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-align-last: right;
}

.account-page--compact .account-history__layout-control::after {
  right: 0.78rem;
  width: 0.5rem;
  height: 0.5rem;
}

.account-page--compact .account-history__link {
  min-height: 3.35rem;
  border-radius: 0.82rem;
  padding: 0.64rem 0.75rem;
}

.account-page--compact .account-history__title {
  font-size: 0.84rem;
  letter-spacing: 0.02em;
}

.account-page--compact .account-history__arrow {
  width: 1rem;
  height: 1rem;
}

.account-page--compact .account-card__layout {
  margin-top: 0.85rem;
  border-radius: 1rem;
  padding: 0.82rem 0.9rem;
}

.account-page--compact .account-card__layout-eyebrow {
  font-size: 0.62rem;
  letter-spacing: 0.14em;
}

.account-page--compact .account-card__layout-copy h2 {
  font-size: 0.92rem;
}

.account-page--compact .account-card__layout-copy p {
  margin-top: 0.35rem;
  font-size: 0.8rem;
}

.account-page--compact .account-card__layout-field {
  gap: 0.32rem;
}

.account-page--compact .account-card__layout-field span {
  font-size: 0.62rem;
}

.account-page--compact .account-card__layout-select {
  min-height: 2.55rem;
  padding: 0 0.75rem;
  border-radius: 0.82rem;
  font-size: 0.84rem;
}

.account-page--compact .account-card__actions {
  margin-top: 0.9rem;
  gap: 0.55rem;
}

.account-page--compact .account-card__row {
  gap: 0.55rem;
}

.account-page--compact .account-card__secondary,
.account-page--compact .account-card__logout,
.account-page--compact .account-card__danger {
  min-height: 2.65rem;
  padding: 0.58rem 0.82rem;
  font-size: 0.84rem;
}

@media (min-width: 768px) {
  .account-page {
    padding:
      max(1.75rem, env(safe-area-inset-top))
      max(1.5rem, env(safe-area-inset-right))
      calc(max(2.5rem, env(safe-area-inset-bottom)) + 96px)
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

  .account-card__progression-top {
    gap: 0.55rem;
  }

  .account-card__progression-controls {
    gap: 0.5rem;
  }

  .account-card__chip {
    padding: 0.5rem 0.72rem;
  }

  .account-card__chip strong {
    font-size: 0.92rem;
  }

  .account-card__chip-label {
    font-size: 0.7rem;
  }

  .account-card__chevron {
    width: 2.1rem;
    height: 2.1rem;
  }

  .account-history__layout-control {
    width: max-content;
  }
}
</style>
