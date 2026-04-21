<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import UserAvatar from '~/components/UserAvatar.vue'
import type { AccountRecentGame } from '~/composables/useAccountApi'
import { useAccountApi } from '~/composables/useAccountApi'
import { usePlayerSession } from '~/composables/usePlayerSession'

const PAGE_SIZE = 4

const router = useRouter()
const { session, hydrated } = usePlayerSession()
const { getAccountSummary, getAccountGames } = useAccountApi()
const { isCompact } = useUiDensity()

const mounted = ref(false)
const isLoading = ref(true)
const loadError = ref('')
const coinsBalance = ref<number>(0)
const xpTotal = ref<number>(0)
const level = ref<number>(1)
const stats = ref<{ games_played: number, wins: number, losses: number }>({
  games_played: 0,
  wins: 0,
  losses: 0,
})
const recentGames = ref<AccountRecentGame[]>([])

const sessionReady = computed(() => mounted.value && hydrated.value)
const accountIdentifier = computed(() => (session.value?.id || session.value?.email?.trim() || '').trim())
const fullName = computed(() => (sessionReady.value ? session.value?.name?.trim() : '') || 'Player')
const profileImage = computed(() => (sessionReady.value ? session.value?.image : undefined))

const playedTotal = computed(() => {
  const fromStats = Math.max(stats.value.games_played || 0, 0)
  const fromWinsLosses = Math.max((stats.value.wins || 0) + (stats.value.losses || 0), 0)
  return Math.max(fromStats, fromWinsLosses)
})

const wins = computed(() => Math.max(stats.value.wins || 0, 0))
const losses = computed(() => Math.max(stats.value.losses || 0, 0))

const chartStyle = computed(() => {
  const total = playedTotal.value
  if (total <= 0) {
    return {
      background: 'conic-gradient(rgba(148,163,184,0.22) 0deg 360deg)',
      '--ring-win-deg': '180deg',
    }
  }

  const winDeg = (wins.value / total) * 360
  const lossDeg = Math.min(360, Math.max(0, 360 - winDeg))
  return {
    background: `conic-gradient(#34d399 0deg ${winDeg}deg, #f43f5e ${winDeg}deg ${winDeg + lossDeg}deg)`,
    '--ring-win-deg': `${winDeg}deg`,
  }
})

const levelProgress = computed(() => {
  const totalXp = Math.max(xpTotal.value || 0, 0)
  let currentLevel = 1
  let xpIntoLevel = totalXp
  let xpNeededForNextLevel = 100

  while (xpIntoLevel >= xpNeededForNextLevel) {
    xpIntoLevel -= xpNeededForNextLevel
    currentLevel += 1
    xpNeededForNextLevel += 50
  }

  return {
    currentLevel: level.value > 0 ? level.value : currentLevel,
    xpIntoLevel,
    xpNeededForNextLevel,
    progressPercent: xpNeededForNextLevel > 0
      ? Math.min((xpIntoLevel / xpNeededForNextLevel) * 100, 100)
      : 0,
  }
})

const recentMarkers = computed(() => {
  const markers = recentGames.value.slice(0, PAGE_SIZE).map((game) => {
    const won = game.result === 'won'
    const lost = game.status === 'completed' && !won
    const coinDelta = game.coins_delta ?? 0
    return {
      key: `${game.match_id}-${game.ended_at ?? game.status}`,
      label: won ? 'W' : (lost ? 'L' : '-'),
      tone: won ? 'profile-page__recent-dot--win' : (lost ? 'profile-page__recent-dot--loss' : 'profile-page__recent-dot--neutral'),
      deltaLabel: formatNumber(Math.abs(coinDelta)),
      deltaTone: coinDelta > 0
        ? 'profile-page__recent-delta--positive'
        : (coinDelta < 0 ? 'profile-page__recent-delta--negative' : 'profile-page__recent-delta--neutral'),
    }
  })

  while (markers.length < PAGE_SIZE) {
    markers.push({
      key: `placeholder-${markers.length}`,
      label: '-',
      tone: 'profile-page__recent-dot--neutral',
      deltaLabel: '0',
      deltaTone: 'profile-page__recent-delta--neutral',
    })
  }

  return markers
})

async function loadProfile() {
  if (!accountIdentifier.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    const [summary, gamesResponse] = await Promise.all([
      getAccountSummary(accountIdentifier.value),
      getAccountGames(accountIdentifier.value, 0, PAGE_SIZE),
    ])

    coinsBalance.value = summary.user.wallet?.coins_balance ?? 0
    xpTotal.value = summary.user.progression?.xp_total ?? 0
    level.value = summary.user.progression?.level ?? 1
    stats.value = summary.user.stats
      ?? gamesResponse.user.stats
      ?? { games_played: 0, wins: 0, losses: 0 }
    recentGames.value = gamesResponse.recent_games_page.games ?? []
  } catch {
    loadError.value = 'We could not load your profile right now.'
  } finally {
    isLoading.value = false
  }
}

function goToRecentGames() {
  router.push('/account/games')
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

onMounted(async () => {
  mounted.value = true
  if (!session.value?.name?.trim()) {
    router.replace('/')
    return
  }

  await loadProfile()
})
</script>

<template>
  <div
    class="profile-page"
    :class="{ 'profile-page--compact': isCompact }"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/account" back-label="Account" />

    <main class="profile-page__content">
      <section class="profile-page__card">
        <header class="profile-page__hero">
          <p class="profile-page__hero-title">Your Profile</p>
          <UserAvatar
            class="profile-page__avatar"
            :name="fullName"
            :image-src="profileImage"
          />
          <div class="profile-page__identity">
            <h1>{{ fullName }}</h1>
            <div class="profile-page__hero-badges">
              <div class="profile-page__level-badge">
                <span class="profile-page__level-badge-label">Level</span>
                <strong>{{ levelProgress.currentLevel }}</strong>
              </div>
              <div class="profile-page__xp-badge">
                <span class="profile-page__xp-badge-label">Total XP</span>
                <strong>{{ formatNumber(xpTotal) }}</strong>
              </div>
            </div>
          </div>
        </header>

        <p v-if="loadError" class="profile-page__message">
          {{ loadError }}
        </p>

        <template v-else>
          <section class="profile-page__section profile-page__section--chart">
            <div class="profile-page__section-head">
              <h2>Games Played</h2>
              <div class="profile-page__coins-badge" aria-label="Coins balance">
                <IconsCoinIcon class="profile-page__coins-badge-icon" />
                <strong>{{ formatNumber(coinsBalance) }}</strong>
              </div>
            </div>

            <div class="profile-page__chart-wrap">
              <div class="profile-page__ring" :style="chartStyle">
                <div class="profile-page__ring-center">
                  <strong>{{ playedTotal }}</strong>
                </div>
              </div>
            </div>

            <div class="profile-page__legend">
              <div class="profile-page__legend-item">
                <span class="profile-page__legend-dot profile-page__legend-dot--loss" />
                <span>Losses</span>
              </div>
              <div class="profile-page__legend-item profile-page__legend-item--right">
                <span class="profile-page__legend-dot profile-page__legend-dot--win" />
                <span>Wins</span>
              </div>
            </div>
          </section>

          <section class="profile-page__section">
            <div class="profile-page__section-head">
              <h2>XP Progress</h2>
              <span>{{ levelProgress.xpIntoLevel }} / {{ levelProgress.xpNeededForNextLevel }}</span>
            </div>
            <div class="profile-page__xp-track" aria-hidden="true">
              <div class="profile-page__xp-fill" :style="{ width: `${levelProgress.progressPercent}%` }" />
            </div>
            <div class="profile-page__xp-levels">
              <span>Lv {{ levelProgress.currentLevel }}</span>
              <span>Lv {{ levelProgress.currentLevel + 1 }}</span>
            </div>
          </section>

          <section class="profile-page__section profile-page__section--recent">
            <div class="profile-page__section-head">
              <h2>Recent Games</h2>
              <button type="button" class="profile-page__recent-link" @click="goToRecentGames">
                <IconsDirectionalArrowIcon class="profile-page__recent-link-icon" />
              </button>
            </div>
            <p class="profile-page__recent-subtext">Last {{ PAGE_SIZE }} games</p>
            <div class="profile-page__recent-row">
              <div
                v-for="marker in recentMarkers"
                :key="marker.key"
                class="profile-page__recent-item"
              >
                <span
                  class="profile-page__recent-dot"
                  :class="marker.tone"
                >
                  {{ marker.label }}
                </span>
                <span class="profile-page__recent-delta" :class="marker.deltaTone">
                  {{ marker.deltaLabel }}
                </span>
              </div>
            </div>
          </section>
        </template>
      </section>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  box-sizing: border-box;
  min-height: 100dvh;
  overflow-y: auto;
  padding:
    max(1.25rem, env(safe-area-inset-top))
    max(0.72rem, env(safe-area-inset-right))
    max(2rem, env(safe-area-inset-bottom))
    max(0.72rem, env(safe-area-inset-left));
  color: #f8fafc;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.4);
}

.profile-page__content {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
}

.profile-page__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
  border-radius: 1.34rem;
  padding: 0.78rem;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.74));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 22px 52px rgba(2, 6, 23, 0.36);
  backdrop-filter: blur(18px);
}

.profile-page__hero {
  position: relative;
  overflow: hidden;
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 0.65rem;
  min-height: 16.25rem;
  padding: 1rem 1rem;
  border-radius: 0.98rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.13), transparent 32%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.11), transparent 40%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.98));
}

.profile-page__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at -4% 78%, rgba(255, 255, 255, 0.04), transparent 28%),
    radial-gradient(circle at 110% 22%, rgba(255, 255, 255, 0.05), transparent 35%);
  pointer-events: none;
}

.profile-page__hero-title {
  margin: 0;
  color: #d4af37;
  font-size: 0.98rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  font-family: "Avenir Next", "Nunito Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

.profile-page__avatar {
  position: relative;
  isolation: isolate;
  width: 5.25rem;
  height: 5.25rem;
  border-radius: 999px;
  padding: 0.12rem;
  background:
    radial-gradient(circle at top, rgba(250, 204, 21, 0.65), rgba(202, 138, 4, 0.55));
  border: 1px solid rgba(250, 204, 21, 0.28);
  box-shadow: 0 16px 28px rgba(2, 6, 23, 0.3);
  font-size: 1.1rem;
  font-weight: 900;
}

.profile-page__avatar::after {
  content: '';
  position: absolute;
  inset: -0.42rem;
  z-index: -1;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 26%, rgba(250, 204, 21, 0.42), transparent 48%),
    radial-gradient(circle at 72% 74%, rgba(56, 189, 248, 0.3), transparent 52%);
  filter: blur(8px);
  opacity: 0.82;
  pointer-events: none;
}

.profile-page__avatar :deep(.user-avatar__image),
.profile-page__avatar :deep(.user-avatar__fallback) {
  width: 100%;
  height: 100%;
  border-radius: 999px;
}

.profile-page__avatar :deep(.user-avatar__fallback) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.82);
  color: #f8f4ec;
  font-size: 1.26rem;
  font-weight: 700;
}

.profile-page__identity h1 {
  margin: 0;
  font-size: 1.66rem;
  line-height: 1.06;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: #f8f4ec;
  font-family: "Avenir Next", "Nunito Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

.profile-page__hero-badges {
  margin-top: 0.38rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.profile-page__level-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-height: 2.05rem;
  padding: 0.34rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  background: rgba(15, 23, 42, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.profile-page__level-badge-label {
  color: rgba(191, 219, 254, 0.82);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.profile-page__level-badge strong {
  color: #dbeafe;
  font-size: 0.88rem;
  font-weight: 900;
  line-height: 1;
}

.profile-page__xp-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.05rem;
  padding: 0.34rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(15, 23, 42, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.profile-page__xp-badge-label {
  color: rgba(186, 230, 253, 0.84);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-page__xp-badge strong {
  color: #bae6fd;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1;
}

.profile-page__message {
  margin: -0.82rem 0 0;
  padding: 0.6rem;
  border-radius: 0.82rem;
  text-align: center;
  font-size: 0.72rem;
  color: rgba(254, 226, 226, 0.95);
  border: 1px solid rgba(248, 113, 113, 0.2);
  background: rgba(127, 29, 29, 0.2);
}

.profile-page__section {
  padding: 0.88rem;
  border-radius: 0.82rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.1), transparent 34%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.08), transparent 38%),
    linear-gradient(155deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.74));
  color: #f8fafc;
}

.profile-page__section--chart {
  margin-top: 0;
  padding-top: 0.88rem;
  padding-bottom: 0.78rem;
}

.profile-page__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
}

.profile-page__section-head h2 {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #d4af37;
}

.profile-page__section-head span {
  color: rgba(148, 163, 184, 0.88);
  font-size: 0.76rem;
  font-weight: 700;
}

.profile-page__coins-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.36rem;
  min-height: 2rem;
  padding: 0.34rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.22);
  background: rgba(15, 23, 42, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: #fde68a;
}

.profile-page__coins-badge strong {
  font-size: 0.84rem;
  font-weight: 900;
  line-height: 1;
}

.profile-page__coins-badge-icon {
  width: 0.86rem;
  height: 0.86rem;
}

.profile-page__chart-subtitle {
  margin: 0.46rem 0 0;
  color: rgba(203, 213, 225, 0.76);
  font-size: 0.74rem;
  font-weight: 600;
}

.profile-page__chart-wrap {
  display: grid;
  place-items: center;
  margin-top: 0.82rem;
}

.profile-page__ring {
  position: relative;
  isolation: isolate;
  width: 8.8rem;
  height: 8.8rem;
  border-radius: 999px;
  box-shadow: 0 10px 18px rgba(2, 6, 23, 0.26);
}

.profile-page__ring::after {
  content: '';
  position: absolute;
  inset: -0.55rem;
  z-index: -1;
  border-radius: 999px;
  background:
    conic-gradient(
      rgba(52, 211, 153, 0.45) 0deg var(--ring-win-deg),
      rgba(244, 63, 94, 0.42) var(--ring-win-deg) 360deg
    );
  filter: blur(10px);
  opacity: 0.72;
  pointer-events: none;
}

.profile-page__ring::before {
  content: '';
  position: absolute;
  inset: 0.4rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.profile-page__ring-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  z-index: 1;
}

.profile-page__ring-center strong {
  font-size: 1.75rem;
  color: #f8f4ec;
  line-height: 1;
}

.profile-page__legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.86rem;
}

.profile-page__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  color: rgba(226, 232, 240, 0.84);
  font-size: 0.76rem;
  font-weight: 700;
}

.profile-page__legend-item--right {
  justify-content: flex-end;
}

.profile-page__legend-dot {
  width: 0.74rem;
  height: 0.74rem;
  border-radius: 999px;
}

.profile-page__legend-dot--win {
  background: #34d399;
}

.profile-page__legend-dot--loss {
  background: #f43f5e;
}

.profile-page__xp-track {
  position: relative;
  isolation: isolate;
  width: 100%;
  margin-top: 0.86rem;
  height: 0.66rem;
  border-radius: 999px;
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: visible;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.profile-page__xp-track::after {
  content: '';
  position: absolute;
  inset: -0.14rem;
  z-index: -1;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.2), rgba(250, 204, 21, 0.18));
  filter: blur(3px);
  opacity: 0.45;
  pointer-events: none;
}

.profile-page__xp-fill {
  position: relative;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #facc15);
  box-shadow:
    0 0 10px rgba(56, 189, 248, 0.34),
    0 0 14px rgba(250, 204, 21, 0.28);
}

.profile-page__xp-fill::after {
  content: '';
  position: absolute;
  inset: -0.2rem -0.1rem;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.5), rgba(250, 204, 21, 0.45));
  filter: blur(6px);
  opacity: 0.68;
  pointer-events: none;
}

.profile-page__xp-levels {
  margin-top: 0.44rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(191, 219, 254, 0.82);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.profile-page__section--recent {
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.16), transparent 38%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.08), transparent 42%),
    linear-gradient(155deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.76));
  padding-top: 0.82rem;
  padding-bottom: 0.72rem;
}

.profile-page__recent-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.68rem;
  border: 1px solid rgba(250, 204, 21, 0.28);
  color: #facc15;
  background: rgba(15, 23, 42, 0.62);
}

.profile-page__recent-link-icon {
  width: 0.95rem;
  height: 0.95rem;
  flex-shrink: 0;
}

.profile-page__recent-subtext {
  color: rgba(148, 163, 184, 0.86);
  font-size: 0.72rem;
  font-weight: 600;
}

.profile-page__recent-row {
  margin-top: 0.92rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 1.1rem;
  padding: 0 0.8rem;
}

.profile-page__recent-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.46rem;
}

.profile-page__recent-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.95rem;
  height: 2.95rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  font-size: 0.96rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.profile-page__recent-dot--win {
  background: rgba(34, 197, 94, 0.26);
  border-color: rgba(34, 197, 94, 0.52);
  color: #bbf7d0;
  box-shadow: 0 0 14px rgba(34, 197, 94, 0.24);
}

.profile-page__recent-dot--loss {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.36);
  color: #fecaca;
}

.profile-page__recent-dot--neutral {
  background: rgba(71, 85, 105, 0.24);
  border-color: rgba(148, 163, 184, 0.22);
  color: rgba(203, 213, 225, 0.72);
}

.profile-page__recent-delta {
  font-size: 0.74rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #fde68a;
}

.profile-page__recent-delta--positive {
  color: #fde68a;
}

.profile-page__recent-delta--negative {
  color: #fde68a;
}

.profile-page__recent-delta--neutral {
  color: #fde68a;
}

.profile-page--compact {
  padding:
    max(0.85rem, env(safe-area-inset-top))
    max(0.5rem, env(safe-area-inset-right))
    max(1.2rem, env(safe-area-inset-bottom))
    max(0.5rem, env(safe-area-inset-left));
}

.profile-page--compact .profile-page__content {
  max-width: 56rem;
}
</style>
