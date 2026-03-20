<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { useAccountApi, type AccountApiUser, type AccountRecentGame } from '~/composables/useAccountApi'

const PAGE_SIZE = 5

const router = useRouter()
const { session } = usePlayerSession()
const { getAccount } = useAccountApi()

const account = ref<AccountApiUser | null>(null)
const games = ref<AccountRecentGame[]>([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const loadError = ref('')
const hasMore = ref(false)
const offset = ref(0)

const accountIdentifier = computed(() => session.value?.id || session.value?.email?.trim() || '')
const totals = computed(() => account.value?.stats ?? { games_played: 0, wins: 0, losses: 0 })

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

async function fetchPage(nextOffset: number) {
  return getAccount(accountIdentifier.value, nextOffset, PAGE_SIZE)
}

async function loadGames(reset = false) {
  if (!accountIdentifier.value) return
  const nextOffset = reset ? 0 : offset.value

  try {
    const response = await fetchPage(nextOffset)
    account.value = response.user
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
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.94)), url(${backgroundGame})` }"
  >
    <header class="games-page__header">
      <NuxtLink to="/account" class="games-page__back">
        ← Account
      </NuxtLink>
      <AppUserMenu />
    </header>

    <main class="games-page__content">
      <section class="games-page__hero">
        <div>
          <p class="games-page__eyebrow">Account Games</p>
          <h1>Match history</h1>
          <p class="games-page__subtitle">
            Your latest games, outcomes, and running totals in one place.
          </p>
        </div>
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

      <p v-else-if="isLoading" class="games-page__message">
        Loading your latest tables...
      </p>

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
              <p class="games-page__match">Match {{ game.match_id }}</p>
              <p class="games-page__meta">{{ game.room_size }} players · {{ formatDate(game.ended_at) }}</p>
            </div>
            <span class="games-page__badge" :class="resultTone(game)">
              {{ outcomeLabel(game) }}
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

.games-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.games-page__back {
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  font-weight: 700;
}

.games-page__content {
  width: 100%;
  max-width: 58rem;
  margin: 0 auto;
}

.games-page__hero,
.games-page__stats,
.games-page__item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 22px 55px rgba(2, 6, 23, 0.28);
  backdrop-filter: blur(18px);
}

.games-page__hero {
  padding: 1.4rem;
  border-radius: 1.75rem;
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
  gap: 0.65rem;
  margin-top: 1.1rem;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.games-page__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(245, 158, 11, 0.12);
}

.games-page__stat--played {
  background: rgba(51, 65, 85, 0.72);
  border-color: rgba(250, 204, 21, 0.18);
}

.games-page__stat--played strong {
  color: #fde68a;
}

.games-page__stat--won {
  background: rgba(20, 83, 45, 0.72);
  border-color: rgba(74, 222, 128, 0.22);
}

.games-page__stat--won strong {
  color: #bbf7d0;
}

.games-page__stat--lost {
  background: rgba(127, 29, 29, 0.72);
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
  line-height: 1.7;
  text-align: center;
}

.games-page__list {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.games-page__item {
  border-radius: 1.45rem;
  padding: 0.95rem 1rem;
}

.games-page__item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.games-page__match {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: #f8fafc;
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
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 800;
  white-space: nowrap;
}

.games-page__badge--win {
  background: rgba(21, 128, 61, 0.22);
  color: #bbf7d0;
}

.games-page__badge--loss {
  background: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
}

.games-page__badge--bot {
  background: rgba(180, 83, 9, 0.22);
  color: #fde68a;
}

.games-page__badge--live {
  background: rgba(30, 64, 175, 0.22);
  color: #bfdbfe;
}

.games-page__load-more {
  width: 100%;
  margin-top: 1.25rem;
  min-height: 3.3rem;
  border-radius: 999px;
  background: #facc15;
  color: #111827;
  font-weight: 800;
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
