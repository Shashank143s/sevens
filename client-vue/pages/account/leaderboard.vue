<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import { useAccountApi, type LeaderboardEntry } from '~/composables/useAccountApi'

const router = useRouter()
const { session } = usePlayerSession()
const { getLeaderboard } = useAccountApi()

const entries = ref<LeaderboardEntry[]>([])
const isLoading = ref(true)
const loadError = ref('')

function countryFlag(countryCode?: string) {
  if (!countryCode || countryCode.length !== 2) return ''
  return countryCode
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

function medalTone(rank: number) {
  if (rank === 1) return 'leaderboard-card__rank--gold'
  if (rank === 2) return 'leaderboard-card__rank--silver'
  if (rank === 3) return 'leaderboard-card__rank--bronze'
  return ''
}

async function loadLeaderboard() {
  try {
    const response = await getLeaderboard(25)
    entries.value = response.entries
    loadError.value = ''
  } catch {
    loadError.value = 'We could not load the leaderboard right now.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!session.value?.name?.trim()) {
    router.replace('/')
    return
  }

  await loadLeaderboard()
})
</script>

<template>
  <div
    class="leaderboard-page"
    :style="{ backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.94)), url(${backgroundGame})` }"
  >
    <header class="leaderboard-page__header">
      <NuxtLink to="/account" class="leaderboard-page__back">
        ← Account
      </NuxtLink>
      <AppUserMenu />
    </header>

    <main class="leaderboard-page__content">
      <section class="leaderboard-page__hero">
        <div class="leaderboard-page__hero-copy">
          <p class="leaderboard-page__eyebrow">Sevens Royale</p>
          <h1>Leaderboard</h1>
          <p class="leaderboard-page__subtitle">
            Top players by coin balance, with progression and wins sharpening the order.
          </p>
        </div>
        <div class="leaderboard-page__hero-chip">
          <IconsCoinIcon class="h-4 w-4" />
          <span>Top 25</span>
        </div>
      </section>

      <p v-if="loadError" class="leaderboard-page__message">
        {{ loadError }}
      </p>
      <section v-else-if="isLoading" class="leaderboard-page__list" aria-label="Loading leaderboard">
        <LeaderboardCardSkeleton />
        <LeaderboardCardSkeleton />
        <LeaderboardCardSkeleton />
        <LeaderboardCardSkeleton />
      </section>
      <p v-else-if="entries.length === 0" class="leaderboard-page__message">
        No leaderboard entries yet.
      </p>

      <section v-else class="leaderboard-page__list">
        <article
          v-for="entry in entries"
          :key="entry.user_id"
          class="leaderboard-card"
          :class="{ 'leaderboard-card--top': entry.rank <= 3 }"
        >
          <div class="leaderboard-card__top">
            <div class="leaderboard-card__main">
              <div class="leaderboard-card__avatar">
                <img
                  v-if="entry.profile_image_url"
                  :src="entry.profile_image_url"
                  :alt="entry.full_name"
                >
                <span v-else>{{ entry.avatar_emoji || '👤' }}</span>
              </div>
              <div class="leaderboard-card__identity">
                <div class="leaderboard-card__name-row">
                  <h2>{{ entry.full_name }}</h2>
                  <span
                    v-if="countryFlag(entry.country_code)"
                    class="leaderboard-card__flag"
                    :title="entry.country_name || entry.country_code"
                  >
                    {{ countryFlag(entry.country_code) }}
                  </span>
                </div>
                <p class="leaderboard-card__meta">
                  {{ entry.wins }} wins · {{ entry.games_played }} games
                </p>
              </div>
            </div>
            <div class="leaderboard-card__rank" :class="medalTone(entry.rank)">
              <span>RANK</span>
              <strong>{{ entry.rank }}</strong>
            </div>
          </div>

          <div class="leaderboard-card__stats">
            <div class="leaderboard-card__stat leaderboard-card__stat--winrate">
              <span>Win %</span>
              <strong>{{ entry.win_percentage }}%</strong>
            </div>
            <div class="leaderboard-card__stat leaderboard-card__stat--coins">
              <span>Coins</span>
              <strong>{{ entry.coins_balance }}</strong>
            </div>
            <div class="leaderboard-card__stat leaderboard-card__stat--level">
              <span>Level</span>
              <strong>Lv {{ entry.level }}</strong>
            </div>
            <div class="leaderboard-card__stat leaderboard-card__stat--xp">
              <span>XP</span>
              <strong>{{ entry.xp_total }}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.leaderboard-page {
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

.leaderboard-page__header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.leaderboard-page__back {
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  font-weight: 700;
}

.leaderboard-page__content {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
}

.leaderboard-page__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
  padding: 0.95rem 1rem;
  border-radius: 1.55rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top right, rgba(250, 204, 21, 0.16), transparent 26%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.14), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.98));
  box-shadow: 0 26px 56px rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(18px);
}

.leaderboard-page__hero-copy {
  min-width: 0;
}

.leaderboard-page__eyebrow {
  margin: 0;
  color: rgba(250, 204, 21, 0.84);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.leaderboard-page__hero h1 {
  margin: 0.45rem 0 0;
  font-size: clamp(1.85rem, 4.8vw, 2.85rem);
  line-height: 0.98;
}

.leaderboard-page__subtitle {
  margin: 0.45rem 0 0;
  max-width: 27rem;
  color: rgba(203, 213, 225, 0.78);
  font-size: 0.92rem;
}

.leaderboard-page__hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.16);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.55rem 0.8rem;
  color: #fde68a;
  font-size: 0.82rem;
  font-weight: 800;
}

.leaderboard-page__message {
  margin-top: 1.5rem;
  text-align: center;
  color: rgba(203, 213, 225, 0.82);
}

.leaderboard-page__list {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.leaderboard-card {
  display: grid;
  gap: 0.72rem;
  padding: 0.85rem 0.9rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at right top, rgba(250, 204, 21, 0.08), transparent 22%),
    radial-gradient(circle at left bottom, rgba(59, 130, 246, 0.06), transparent 28%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.74));
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.22);
  backdrop-filter: blur(14px);
}

.leaderboard-card--top {
  border-color: rgba(250, 204, 21, 0.14);
  box-shadow:
    0 20px 44px rgba(2, 6, 23, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.leaderboard-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
}

.leaderboard-card__main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.leaderboard-card__rank {
  display: grid;
  justify-items: center;
  align-content: center;
  flex-shrink: 0;
  min-width: 4.25rem;
  min-height: 4.25rem;
  padding: 0.45rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 34px rgba(2, 6, 23, 0.16);
  color: #e2e8f0;
  text-align: center;
}

.leaderboard-card__rank span {
  color: rgba(148, 163, 184, 0.8);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.leaderboard-card__rank strong {
  margin-top: 0.08rem;
  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1;
}

.leaderboard-card__rank--gold {
  border-color: rgba(250, 204, 21, 0.32);
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 244, 163, 0.34), transparent 36%),
    linear-gradient(180deg, rgba(250, 204, 21, 0.22), rgba(146, 64, 14, 0.16));
  color: #fde68a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 18px 36px rgba(250, 204, 21, 0.16);
}

.leaderboard-card__rank--silver {
  border-color: rgba(226, 232, 240, 0.26);
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.24), transparent 38%),
    linear-gradient(180deg, rgba(226, 232, 240, 0.18), rgba(71, 85, 105, 0.16));
  color: #f8fafc;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 18px 34px rgba(148, 163, 184, 0.14);
}

.leaderboard-card__rank--bronze {
  border-color: rgba(251, 146, 60, 0.26);
  background:
    radial-gradient(circle at 50% 18%, rgba(253, 186, 116, 0.26), transparent 38%),
    linear-gradient(180deg, rgba(251, 146, 60, 0.18), rgba(124, 45, 18, 0.16));
  color: #fdba74;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 18px 34px rgba(251, 146, 60, 0.14);
}

.leaderboard-card__avatar {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.95rem;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 1.35rem;
}

.leaderboard-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.leaderboard-card__identity {
  min-width: 0;
}

.leaderboard-card__name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.leaderboard-card__name-row h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
  color: #f8fafc;
}

.leaderboard-card__flag {
  font-size: 1rem;
  line-height: 1;
}

.leaderboard-card__meta {
  margin: 0.22rem 0 0;
  color: rgba(148, 163, 184, 0.88);
  font-size: 0.78rem;
}

.leaderboard-card__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;
}

.leaderboard-card__stat {
  display: grid;
  justify-items: center;
  gap: 0.16rem;
  min-height: 4.5rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025)),
    rgba(255, 255, 255, 0.035);
  padding: 0.62rem 0.45rem 0.58rem;
  text-align: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 12px 28px rgba(2, 6, 23, 0.12);
}

.leaderboard-card__stat span {
  display: block;
  color: rgba(148, 163, 184, 0.84);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.leaderboard-card__stat strong {
  display: block;
  margin-top: 0.08rem;
  color: #f8fafc;
  font-size: 1.28rem;
  font-weight: 900;
  line-height: 1.05;
}

.leaderboard-card__stat--winrate strong {
  color: #fef08a;
}

.leaderboard-card__stat--winrate {
  border-color: rgba(250, 204, 21, 0.16);
  background:
    radial-gradient(circle at top center, rgba(250, 204, 21, 0.12), transparent 52%),
    linear-gradient(180deg, rgba(250, 204, 21, 0.08), rgba(255, 255, 255, 0.025));
}

.leaderboard-card__stat--coins {
  border-color: rgba(250, 204, 21, 0.14);
  background:
    radial-gradient(circle at top center, rgba(251, 191, 36, 0.12), transparent 52%),
    linear-gradient(180deg, rgba(120, 53, 15, 0.14), rgba(255, 255, 255, 0.025));
}

.leaderboard-card__stat--coins strong {
  color: #fde68a;
}

.leaderboard-card__stat--coins strong::before {
  content: '';
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  margin-right: 0.35rem;
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 35%, #fde68a, #facc15 60%, #ca8a04 100%);
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.24);
  vertical-align: -0.08rem;
}

.leaderboard-card__stat--level {
  border-color: rgba(96, 165, 250, 0.16);
  background:
    radial-gradient(circle at top center, rgba(96, 165, 250, 0.13), transparent 52%),
    linear-gradient(180deg, rgba(30, 41, 59, 0.22), rgba(255, 255, 255, 0.025));
}

.leaderboard-card__stat--level strong {
  color: #dbeafe;
}

.leaderboard-card__stat--xp strong {
  color: rgba(191, 219, 254, 0.92);
}

.leaderboard-card__stat--xp {
  border-color: rgba(34, 211, 238, 0.16);
  background:
    radial-gradient(circle at top center, rgba(34, 211, 238, 0.13), transparent 52%),
    linear-gradient(180deg, rgba(8, 47, 73, 0.18), rgba(255, 255, 255, 0.025));
}

@media (max-width: 640px) {
  .leaderboard-page__hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .leaderboard-card {
    gap: 0.75rem;
  }

  .leaderboard-card__top {
    align-items: center;
  }

  .leaderboard-card__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.32rem;
  }

  .leaderboard-card__stat {
    min-height: 4rem;
    padding: 0.48rem 0.28rem 0.44rem;
  }

  .leaderboard-card__stat span {
    font-size: 0.54rem;
    letter-spacing: 0.09em;
  }

  .leaderboard-card__stat strong {
    font-size: 1.02rem;
  }

  .leaderboard-card__stat--coins strong::before {
    width: 0.56rem;
    height: 0.56rem;
    margin-right: 0.24rem;
  }

  .leaderboard-card__rank {
    min-width: 3.4rem;
    min-height: 3.4rem;
    padding: 0.34rem;
  }

  .leaderboard-card__rank span {
    font-size: 0.56rem;
  }

  .leaderboard-card__rank strong {
    font-size: 1.45rem;
  }
}
</style>
