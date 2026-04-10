<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { useAccountApi, type AccountRecentGame } from '~/composables/useAccountApi'

const PAGE_SIZE = 5

const router = useRouter()
const { session } = usePlayerSession()
const { getAccountGames } = useAccountApi()

const accountStats = ref<{ games_played: number; wins: number; losses: number } | null>(null)
const games = ref<AccountRecentGame[]>([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const loadError = ref('')
const hasMore = ref(false)
const offset = ref(0)

const accountIdentifier = computed(() => session.value?.id || session.value?.email?.trim() || '')
const totals = computed(() => accountStats.value ?? { games_played: 0, wins: 0, losses: 0 })

function formatDate(value?: string | number) {
  if (!value) return 'Still active'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function outcomeLabel(game: AccountRecentGame) {
  if (game.result === 'won') return 'You won'
  if (game.status !== 'completed') return 'In progress'
  if (game.winner_is_bot) return 'AI Bot Won'
  if (game.winner_name) return `${game.winner_name.split(/\s+/)[0]} Won`
  return 'Completed'
}

function resultTone(game: AccountRecentGame) {
  if (game.result === 'won') return 'games-page__badge--win'
  if (game.status === 'completed') return 'games-page__badge--loss'
  return 'games-page__badge--live'
}

function formatDelta(value = 0, unit = '') {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${unit ? ` ${unit}` : ''}`
}

function deltaTone(value = 0) {
  if (value > 0) return 'games-page__delta--positive'
  if (value < 0) return 'games-page__delta--negative'
  return 'games-page__delta--neutral'
}

async function fetchPage(nextOffset: number) {
  return getAccountGames(accountIdentifier.value, nextOffset, PAGE_SIZE)
}

async function loadGames(reset = false) {
  if (!accountIdentifier.value) return
  const nextOffset = reset ? 0 : offset.value

  try {
    const response = await fetchPage(nextOffset)
    accountStats.value = response.user.stats ?? { games_played: 0, wins: 0, losses: 0 }
    const nextGames = response.recent_games_page.games
    games.value = reset ? nextGames : [...games.value, ...nextGames]
    hasMore.value = response.recent_games_page.has_more
    offset.value = nextOffset + nextGames.length
    loadError.value = ''
  } catch {
    loadError.value = 'We could not load your match history right now.'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

async function loadMore() {
  if (isLoadingMore.value || !hasMore.value) return
  isLoadingMore.value = true
  await loadGames()
}

onMounted(async () => {
  if (!session.value?.name?.trim()) {
    router.replace('/')
    return
  }

  await loadGames(true)
})
</script>

<template>
  <div
    class="games-page"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/account" back-label="Account" />

    <main class="games-page__content">
      <section class="games-page__hero">
        <div class="games-page__hero-copy">
          <p class="games-page__eyebrow">Account Games</p>
          <h1>Match history</h1>
          <p class="games-page__subtitle">
            Your latest games, outcomes, and running totals in one place.
          </p>
        </div>
        <div class="games-page__hero-glow" aria-hidden="true" />
      </section>

      <section class="games-page__stats">
        <article class="games-page__stat games-page__stat--played">
          <span>Played</span>
          <strong>{{ totals.games_played }}</strong>
        </article>
        <article class="games-page__stat games-page__stat--won">
          <span>Won</span>
          <strong>{{ totals.wins }}</strong>
        </article>
        <article class="games-page__stat games-page__stat--lost">
          <span>Lost</span>
          <strong>{{ totals.losses }}</strong>
        </article>
      </section>

      <p v-if="loadError" class="games-page__message">
        {{ loadError }}
      </p>

      <section v-else-if="isLoading" class="games-page__list" aria-label="Loading recent games">
        <RecentGameCardSkeleton />
        <RecentGameCardSkeleton />
        <RecentGameCardSkeleton />
      </section>

      <p v-else-if="games.length === 0" class="games-page__message">
        No games recorded yet.
      </p>

      <section v-else class="games-page__list">
        <article
          v-for="game in games"
          :key="`${game.match_id}-${game.ended_at ?? game.status}`"
          class="games-page__item"
        >
          <div class="games-page__item-top">
            <div>
              <p class="games-page__match">{{ game.room_name || 'Sevens Royale' }}</p>
              <p class="games-page__meta">{{ game.room_size }} players · {{ formatDate(game.ended_at) }}</p>
            </div>
            <span class="games-page__badge" :class="resultTone(game)">
              {{ outcomeLabel(game) }}
            </span>
          </div>
          <div class="games-page__item-bottom">
            <span class="games-page__delta" :class="deltaTone(game.coins_delta ?? 0)">
              {{ formatDelta(game.coins_delta ?? 0) }}
              <IconsCoinIcon class="games-page__coin-icon" />
            </span>
            <span class="games-page__delta" :class="deltaTone(game.xp_delta ?? 0)">
              {{ formatDelta(game.xp_delta ?? 0) }}
              <span class="games-page__xp-label">XP</span>
            </span>
          </div>
        </article>
      </section>

      <button
        v-if="hasMore"
        type="button"
        class="games-page__load-more"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        {{ isLoadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </main>
  </div>
</template>

<style scoped>
.games-page {
  position: relative;
  overflow-x: clip;
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

.games-page::before,
.games-page::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 999px;
  filter: blur(72px);
  opacity: 0.7;
}

.games-page::before {
  top: 7rem;
  left: -4rem;
  width: 14rem;
  height: 14rem;
  background: rgba(56, 189, 248, 0.12);
}

.games-page::after {
  top: 11rem;
  right: -3rem;
  width: 15rem;
  height: 15rem;
  background: rgba(250, 204, 21, 0.14);
}

.games-page__header {
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

.games-page__back {
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

.games-page__back:hover,
.games-page__back:focus-visible {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(212, 175, 55, 0.22);
}

.games-page__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 58rem;
  margin: 0 auto;
}

.games-page__hero {
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.14), transparent 30%),
    radial-gradient(circle at left center, rgba(59, 130, 246, 0.12), transparent 32%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 24px 60px rgba(2, 6, 23, 0.34);
  backdrop-filter: blur(22px);
}

.games-page__hero-copy {
  position: relative;
  z-index: 1;
}

.games-page__hero-glow {
  position: absolute;
  right: -2.5rem;
  bottom: -3rem;
  width: 12rem;
  height: 12rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(250, 204, 21, 0.18), transparent 70%);
  filter: blur(12px);
}

.games-page__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.games-page__hero h1 {
  margin: 0.35rem 0 0;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  color: #f8f4ec;
}

.games-page__subtitle {
  margin: 0.65rem 0 0;
  max-width: 36rem;
  color: rgba(203, 213, 225, 0.82);
  line-height: 1.7;
}

.games-page__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.15rem;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.games-page__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.62rem 0.92rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px);
}

.games-page__stat--played {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.76), rgba(30, 41, 59, 0.76));
  border-color: rgba(250, 204, 21, 0.18);
}

.games-page__stat--played strong {
  color: #fde68a;
}

.games-page__stat--won {
  background: linear-gradient(135deg, rgba(20, 83, 45, 0.74), rgba(6, 95, 70, 0.72));
  border-color: rgba(74, 222, 128, 0.22);
}

.games-page__stat--won strong {
  color: #bbf7d0;
}

.games-page__stat--lost {
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.78), rgba(153, 27, 27, 0.72));
  border-color: rgba(248, 113, 113, 0.22);
}

.games-page__stat--lost strong {
  color: #fecaca;
}

.games-page__stat span,
.games-page__meta,
.games-page__message {
  color: rgba(203, 213, 225, 0.82);
}

.games-page__stat strong {
  font-size: 0.95rem;
  color: #f8fafc;
}

.games-page__message {
  margin: 1.25rem 0 0;
  padding: 1.15rem;
  line-height: 1.7;
  text-align: center;
  border-radius: 1.35rem;
  background: rgba(15, 23, 42, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.games-page__list {
  display: grid;
  gap: 1rem;
  margin-top: 1.3rem;
}

.games-page__item {
  position: relative;
  overflow: hidden;
  border-radius: 1.55rem;
  padding: 1rem 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28%),
    linear-gradient(160deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.7));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 48px rgba(2, 6, 23, 0.26);
  backdrop-filter: blur(18px);
}

.games-page__item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.games-page__match {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #f8f4ec;
}

.games-page__meta {
  margin: 0.4rem 0 0;
  text-transform: capitalize;
}

.games-page__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.2rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 800;
  white-space: nowrap;
  border: 1px solid transparent;
}

.games-page__badge--win {
  background: linear-gradient(135deg, rgba(21, 128, 61, 0.26), rgba(5, 150, 105, 0.24));
  border-color: rgba(74, 222, 128, 0.18);
  color: #bbf7d0;
}

.games-page__badge--loss {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.18), rgba(71, 85, 105, 0.22));
  border-color: rgba(148, 163, 184, 0.14);
  color: #e2e8f0;
}

.games-page__badge--bot {
  background: rgba(180, 83, 9, 0.22);
  color: #fde68a;
}

.games-page__badge--live {
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.24), rgba(29, 78, 216, 0.22));
  border-color: rgba(96, 165, 250, 0.16);
  color: #bfdbfe;
}

.games-page__item-bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.85rem;
}

.games-page__delta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.38rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  gap: 0.45rem;
  border: 1px solid transparent;
}

.games-page__coin-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.games-page__xp-label {
  color: #facc15;
  text-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
}

.games-page__delta--positive {
  background: linear-gradient(135deg, rgba(21, 128, 61, 0.22), rgba(5, 150, 105, 0.18));
  border-color: rgba(74, 222, 128, 0.16);
  color: #bbf7d0;
}

.games-page__delta--negative {
  background: linear-gradient(135deg, rgba(185, 28, 28, 0.22), rgba(127, 29, 29, 0.2));
  border-color: rgba(248, 113, 113, 0.16);
  color: #fecaca;
}

.games-page__delta--neutral {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.62), rgba(30, 41, 59, 0.58));
  border-color: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
}

.games-page__load-more {
  width: 100%;
  margin-top: 1.25rem;
  min-height: 3.3rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.24);
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #111827;
  font-weight: 800;
  box-shadow: 0 18px 40px rgba(245, 158, 11, 0.2);
}

@media (min-width: 768px) {
  .games-page {
    padding:
      max(1.75rem, env(safe-area-inset-top))
      max(1.5rem, env(safe-area-inset-right))
      max(2.5rem, env(safe-area-inset-bottom))
      max(1.5rem, env(safe-area-inset-left));
  }

}
</style>
