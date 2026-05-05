<script setup lang="ts">
import backgroundGame from '~/assets/images/poker_cards_table.png'
import botLogo from '~/assets/images/bot_logo.png'
import UserAvatar from '~/components/UserAvatar.vue'
import { useAccountApi, type AccountMatchup } from '~/composables/useAccountApi'

const router = useRouter()
const { session } = usePlayerSession()
const { getAccountMatchups } = useAccountApi()
const { isAndroidApp } = useAppSource()
const { isCompact } = useUiDensity()

const emptyMatchup = {
  isBot: true,
  opponent: {},
  games: {
    total: 0,
    won: 0,
    lost: 0,
  },
} as AccountMatchup

const matchups = ref<AccountMatchup[]>([])
const isLoading = ref(true)
const loadError = ref('')

const accountIdentifier = computed(() => (session.value?.id || session.value?.email?.trim() || '').trim())
const fullName = computed(() => session.value?.name?.trim() || 'Player')
const profileImage = computed(() => session.value?.image)
const botMatchup = computed(() => matchups.value.find((matchup) => matchup.isBot) ?? emptyMatchup)
const humanMatchups = computed(() => matchups.value.filter((matchup) => !matchup.isBot))
const showBottomMetrics = computed(() => !isCompact.value && !isAndroidApp.value)

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

function formatPercent(won: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((won / total) * 100)}%`
}

function matchupWinRate(matchup: AccountMatchup) {
  return formatPercent(matchup.games.won, matchup.games.total)
}

function matchupOpponentWinRate(matchup: AccountMatchup) {
  return formatPercent(matchup.games.lost, matchup.games.total)
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || value.trim()
}

function opponentLabel(matchup: AccountMatchup) {
  return matchup.opponent.name?.trim() || 'Unknown Opponent'
}

async function loadMatchups() {
  if (!accountIdentifier.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    const response = await getAccountMatchups(accountIdentifier.value)
    matchups.value = response.matchups ?? []
  } catch {
    loadError.value = 'We could not load matchup stats right now.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!session.value?.name?.trim()) {
    router.replace('/')
    return
  }

  await loadMatchups()
})
</script>

<template>
  <div
    class="matchup-page"
    :class="{ 'matchup-page--compact': isCompact }"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/account/profile" back-label="Profile" />

    <main class="matchup-page__content">
      <section class="matchup-page__hero">
        <div class="matchup-page__hero-copy">
          <p class="matchup-page__eyebrow">Account Stats</p>
          <h1>Matchup stats</h1>
          <p class="matchup-page__subtitle">
            A compact view of your bot head-to-head record and every human opponent you have faced.
          </p>
        </div>
      </section>

      <p v-if="loadError" class="matchup-page__message">
        {{ loadError }}
      </p>

      <section v-else-if="isLoading" class="matchup-page__stack" aria-label="Loading matchup stats">
        <article class="matchup-page__card matchup-page__card--skeleton" />
        <article class="matchup-page__card matchup-page__card--skeleton" />
        <article class="matchup-page__card matchup-page__card--skeleton" />
      </section>

      <section v-else class="matchup-page__stack">
        <article class="matchup-page__card matchup-page__duel-card matchup-page__duel-card--bot">
          <div class="matchup-page__duel-top">
            <div class="matchup-page__duel-side matchup-page__duel-side--self">
              <div class="matchup-page__duel-avatar-stack">
                <UserAvatar
                  class="matchup-page__duel-avatar matchup-page__duel-avatar--self"
                  :name="fullName"
                  :image-src="profileImage"
                />
                <span class="matchup-page__duel-label">{{ firstName(fullName) }}</span>
              </div>
              <div class="matchup-page__duel-copy">
                <div class="matchup-page__duel-wins">
                  <span>WINS</span>
                  <strong>{{ formatNumber(botMatchup.games.won) }}</strong>
                </div>
              </div>
            </div>

            <div v-if="!showBottomMetrics" class="matchup-page__duel-vs matchup-page__duel-vs--games">
              <span>GAMES</span>
              <strong>{{ formatNumber(botMatchup.games.total) }}</strong>
            </div>

            <div v-else class="profile-page__showdown-vs">V/S</div>

            <div class="matchup-page__duel-side matchup-page__duel-side--opponent">
              <div class="matchup-page__duel-copy matchup-page__duel-copy--right">
                <div class="matchup-page__duel-wins">
                  <span>WINS</span>
                  <strong>{{ formatNumber(botMatchup.games.lost) }}</strong>
                </div>
              </div>
              <div class="matchup-page__duel-avatar-stack matchup-page__duel-avatar-stack--right">
                <UserAvatar
                  class="matchup-page__duel-avatar matchup-page__duel-avatar--opponent matchup-page__duel-avatar--bot"
                  name="Artificial Intelligence"
                  :image-src="botLogo"
                />
                <span class="matchup-page__duel-label">Bots</span>
              </div>
            </div>
          </div>

          <div v-if="showBottomMetrics" class="matchup-page__duel-divider" />

          <div v-if="showBottomMetrics" class="matchup-page__duel-bottom">
            <div class="matchup-page__duel-metric">
              <span>WIN %</span>
              <strong>{{ matchupWinRate(botMatchup) }}</strong>
            </div>
            <div class="matchup-page__duel-metric matchup-page__duel-metric--center">
              <span>GAMES</span>
              <strong>{{ formatNumber(botMatchup.games.total) }}</strong>
            </div>
            <div class="matchup-page__duel-metric matchup-page__duel-metric--opponent">
              <span>WIN %</span>
              <strong>{{ matchupOpponentWinRate(botMatchup) }}</strong>
            </div>
          </div>
        </article>

        <article class="matchup-page__card matchup-page__card--humans">
          <div class="matchup-page__section-head">
            <h2>Versus Human</h2>
          </div>

          <p v-if="humanMatchups.length === 0" class="matchup-page__empty">
            No human matchup stats yet.
          </p>

          <div v-else class="matchup-page__opponent-list">
            <article
              v-for="matchup in humanMatchups"
              :key="`${matchup.opponent.email || matchup.opponent.name || 'opponent'}-${matchup.games.total}-${matchup.games.won}`"
              class="matchup-page__card matchup-page__duel-card matchup-page__duel-card--human"
            >
              <div class="matchup-page__duel-top">
            <div class="matchup-page__duel-side matchup-page__duel-side--self">
                  <div class="matchup-page__duel-avatar-stack">
                    <UserAvatar
                      class="matchup-page__duel-avatar matchup-page__duel-avatar--self"
                      :name="fullName"
                      :image-src="profileImage"
                    />
                    <span class="matchup-page__duel-label">{{ firstName(fullName) }}</span>
                  </div>
                  <div class="matchup-page__duel-copy">
                    <div class="matchup-page__duel-wins">
                      <span>WINS</span>
                      <strong>{{ formatNumber(matchup.games.won) }}</strong>
                    </div>
                  </div>
                </div>

                <div v-if="!showBottomMetrics" class="matchup-page__duel-vs matchup-page__duel-vs--games">
                  <span>GAMES</span>
                  <strong>{{ formatNumber(matchup.games.total) }}</strong>
                </div>

                <div v-else class="profile-page__showdown-vs">V/S</div>

                <div class="matchup-page__duel-side matchup-page__duel-side--opponent">
                  <div class="matchup-page__duel-copy matchup-page__duel-copy--right">
                    <div class="matchup-page__duel-wins">
                      <span>WINS</span>
                      <strong>{{ formatNumber(matchup.games.lost) }}</strong>
                    </div>
                  </div>
                  <div class="matchup-page__duel-avatar-stack matchup-page__duel-avatar-stack--right">
                    <UserAvatar
                      class="matchup-page__duel-avatar matchup-page__duel-avatar--opponent"
                      :name="opponentLabel(matchup)"
                      :image-src="matchup.opponent.image"
                    />
                    <span class="matchup-page__duel-label">{{ firstName(opponentLabel(matchup)) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="showBottomMetrics" class="matchup-page__duel-divider" />

              <div v-if="showBottomMetrics" class="matchup-page__duel-bottom">
                <div class="matchup-page__duel-metric">
                  <span>WIN %</span>
                  <strong>{{ matchupWinRate(matchup) }}</strong>
                </div>
                <div class="matchup-page__duel-metric matchup-page__duel-metric--center">
                  <span>GAMES</span>
                  <strong>{{ formatNumber(matchup.games.total) }}</strong>
                </div>
                <div class="matchup-page__duel-metric matchup-page__duel-metric--opponent">
                  <span>WIN %</span>
                  <strong>{{ matchupOpponentWinRate(matchup) }}</strong>
                </div>
              </div>
            </article>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.matchup-page {
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
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.42);
}

.matchup-page::before,
.matchup-page::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 999px;
  filter: blur(72px);
  opacity: 0.75;
}

.matchup-page::before {
  top: 8rem;
  left: -4rem;
  width: 14rem;
  height: 14rem;
  background: rgba(56, 189, 248, 0.12);
}

.matchup-page::after {
  top: 12rem;
  right: -3rem;
  width: 15rem;
  height: 15rem;
  background: rgba(250, 204, 21, 0.12);
}

.matchup-page__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
}

.matchup-page__hero {
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

.matchup-page__hero-copy {
  display: grid;
  gap: 0.35rem;
}

.matchup-page__eyebrow,
.matchup-page__section-label {
  margin-bottom: 0.4rem;
  color: rgba(125, 211, 252, 0.92);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.matchup-page__hero h1,
.matchup-page__section-head-copy h2,
.matchup-page__identity h2,
.matchup-page__identity h3 {
  margin: 0;
  font-family: "Avenir Next", "Nunito Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  line-height: 1;
}

.matchup-page__hero h1 {
  font-size: clamp(1.85rem, 4.8vw, 2.85rem);
}

.profile-page__showdown-vs {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #facc15;
  font-size: 1.48rem;
  font-weight: 600;
  letter-spacing: 0.14em;

}

.matchup-page__subtitle {
  margin: 0;
  max-width: 30rem;
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.95rem;
  line-height: 1.45;
}

.matchup-page__hero-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.matchup-page__hero-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  min-width: 4.85rem;
  min-height: 2.6rem;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.16);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  color: #fde68a;
  font-size: 0.8rem;
  font-weight: 800;
}

.matchup-page__hero-chip span:last-child {
  color: rgba(203, 213, 225, 0.76);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.matchup-page__stack {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.matchup-page__card {
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at right top, rgba(250, 204, 21, 0.08), transparent 22%),
    radial-gradient(circle at left bottom, rgba(59, 130, 246, 0.06), transparent 28%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.74));
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.22);
  backdrop-filter: blur(14px);
}

.matchup-page__card--bot {
  padding: 0.9rem;
  border-color: rgba(250, 204, 21, 0.14);
  box-shadow:
    0 20px 44px rgba(2, 6, 23, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.matchup-page__card--humans {
  padding: 0.85rem 0.9rem;
}

.matchup-page__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
  margin-bottom: 0.72rem;
}

.matchup-page__section-head h2 {
  margin: 0;
  color: #d4af37;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.matchup-page__duel-card {
  display: grid;
  gap: 0.7rem;
  padding: 0.85rem;
}

.matchup-page__duel-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.6rem;
}

.matchup-page__duel-side {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.matchup-page__duel-side--opponent {
  justify-content: flex-end;
}

.matchup-page__duel-copy {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.matchup-page__duel-copy--right {
  justify-items: end;
  text-align: right;
}

.matchup-page__duel-avatar-stack {
  display: grid;
  justify-items: center;
  gap: 0.14rem;
  flex-shrink: 0;
}

.matchup-page__duel-avatar-stack--right {
  justify-items: center;
}

.matchup-page__duel-avatar {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  padding: 0.12rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 24px rgba(2, 6, 23, 0.22);
}

.matchup-page__duel-avatar :deep(.user-avatar__image),
.matchup-page__duel-avatar :deep(.user-avatar__fallback) {
  width: 100%;
  height: 100%;
  border-radius: 999px;
}

.matchup-page__duel-avatar :deep(.user-avatar__fallback) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(132, 134, 150, 0.82);
  color: #f8f4ec;
  font-size: 1.02rem;
  font-weight: 800;
}

.matchup-page__duel-avatar--bot :deep(.user-avatar__image) {
  width: 220%;
  height: 220%;
}

.matchup-page__duel-avatar--bot :deep(.user-avatar__fallback) {
  background: rgba(15, 23, 42, 0.84);
  color: #fde68a;
}

.matchup-page__duel-avatar--bot {
  width: 3.9rem;
  height: 3.9rem;
}

.matchup-page__duel-avatar--self {
  border-color: rgba(250, 204, 21, 0.24);
  background:
    radial-gradient(circle at top, rgba(250, 204, 21, 0.38), rgba(15, 23, 42, 0.72));
}

.matchup-page__duel-avatar--opponent {
  border-color: rgba(96, 165, 250, 0.2);
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.22), rgba(15, 23, 42, 0.72));
}

.matchup-page__duel-label {
  padding-top: 0.2rem;
  color: rgba(226, 232, 240, 0.74);
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1;
}

.matchup-page__duel-name {
  color: #f8fafc;
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1;
}

.matchup-page__duel-vs {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 2.1rem;
  min-height: 2.1rem;
  /* padding: 0.2rem 0.3rem;
  border-radius: 0.84rem;
  border: 1px solid rgba(250, 204, 21, 0.18); */
  background: rgba(15, 23, 42, 0.52);
  color: #f8fafc;
}

.matchup-page__duel-vs--games {
  gap: 0.08rem;
}

.matchup-page__duel-vs--games span {
  color: rgba(148, 163, 184, 0.9);
  font-size: 0.42rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1;
}

.matchup-page__duel-vs--games strong {
  color: #f8fafc;
  font-size: 1.3rem;
  line-height: 1;
  font-weight: 900;
}

.matchup-page__duel-wins {
  display: grid;
  justify-items: center;
  gap: 0.06rem;
  min-width: 3.35rem;
  /* padding: 0.24rem 0.34rem;
  border-radius: 0.78rem;
  border: 1px solid rgba(250, 204, 21, 0.18); */
  background: rgba(15, 23, 42, 0.44);
}

.matchup-page__duel-wins span {
  color: rgba(148, 163, 184, 0.88);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.matchup-page__duel-wins strong {
  color: #f8fafc;
  font-size: 1.05rem;
  line-height: 1;
  font-weight: 900;
}

.matchup-page__duel-divider {
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.22), rgba(56, 189, 248, 0.22), transparent);
}

.matchup-page__duel-bottom {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.matchup-page__duel-metric {
  display: grid;
  justify-items: center;
  gap: 0.06rem;
  padding: 0.34rem 0.42rem;
  /* border-radius: 0.84rem;
  border: 1px solid rgba(255, 255, 255, 0.08); */
  background: rgba(15, 23, 42, 0.4);
  text-align: center;
}

.matchup-page__duel-metric span {
  color: rgba(148, 163, 184, 0.86);
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.matchup-page__duel-metric strong {
  color: #dbeafe;
  font-size: 0.94rem;
  line-height: 1;
  font-weight: 900;
}

.matchup-page__duel-metric--center strong {
  color: #f8fafc;
  font-size: 1.05rem;
}

.matchup-page__duel-metric--opponent strong {
  color: #a5f3fc;
}

.matchup-page__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

/* .matchup-page__top--card {
  margin-bottom: 0.75rem;
} */

.matchup-page__main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
  min-width: 0;
}

.matchup-page__avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.matchup-page__avatar :deep(.user-avatar__image),
.matchup-page__avatar :deep(.user-avatar__fallback) {
  width: 100%;
  height: 100%;
  border-radius: 999px;
}

.matchup-page__avatar :deep(.user-avatar__fallback) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(132, 134, 150, 0.82);
  color: #f8f4ec;
  font-size: 1.02rem;
  font-weight: 800;
}

.matchup-page__identity {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.matchup-page__identity h2 {
  font-size: 1.2rem;
  color: #f8fafc;
}

.matchup-page__identity h3 {
  font-size: 0.85rem;
  color: #f8fafc;
}

.matchup-page__identity p {
  margin: 0;
  color: rgba(203, 213, 225, 0.82);
  font-size: 0.72rem;
}

.matchup-page__name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.matchup-page__flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.4rem;
  padding: 0.12rem 0.42rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.18);
  background: rgba(15, 23, 42, 0.48);
  color: #fde68a;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.matchup-page__rank {
  display: grid;
  justify-items: center;
  align-content: center;
  flex-shrink: 0;
  min-width: 4.25rem;
  min-height: 4.25rem;
  padding: 0.45rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(250, 204, 21, 0.18);
  background:
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 34px rgba(2, 6, 23, 0.16);
  color: #e2e8f0;
  text-align: center;
}

.matchup-page__rank span {
  color: rgba(148, 163, 184, 0.86);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.matchup-page__rank strong {
  color: #fde68a;
  font-size: 1.65rem;
  line-height: 1;
  font-weight: 900;
}

.matchup-page__rank--human strong {
  color: #f8fafc;
}

.matchup-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.matchup-page__stats--card {
  margin-top: 0.6rem;
}

.matchup-page__stat {
  display: grid;
  gap: 0.1rem;
  padding: 0.58rem 0.68rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.38);
  text-align: center;
}

.matchup-page__stat span {
  color: rgba(148, 163, 184, 0.88);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.matchup-page__stat strong {
  font-size: 1.1rem;
  line-height: 1;
  font-weight: 900;
}

.matchup-page__stat--played {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.76), rgba(30, 41, 59, 0.76));
  border-color: rgba(250, 204, 21, 0.18);
}

.matchup-page__stat--played strong {
  color: #fde68a;
}

.matchup-page__stat--won {
  background: linear-gradient(135deg, rgba(20, 83, 45, 0.74), rgba(6, 95, 70, 0.72));
  border-color: rgba(74, 222, 128, 0.22);
}

.matchup-page__stat--won strong {
  color: #bbf7d0;
}

.matchup-page__stat--lost {
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.78), rgba(153, 27, 27, 0.72));
  border-color: rgba(248, 113, 113, 0.22);
}

.matchup-page__stat--lost strong {
  color: #fecaca;
}

.matchup-page__stat--winrate {
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.24), rgba(29, 78, 216, 0.22));
  border-color: rgba(96, 165, 250, 0.16);
}

.matchup-page__stat--winrate strong {
  color: #bfdbfe;
}

.matchup-page__main > .matchup-page__stat--winrate {
  margin-left: auto;
}

.matchup-page__opponent-list {
  display: grid;
  gap: 0.7rem;
}

.matchup-page__opponent-card {
  display: grid;
  gap: 0.55rem;
  padding: 0.8rem 0.85rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at right top, rgba(250, 204, 21, 0.08), transparent 22%),
    radial-gradient(circle at left bottom, rgba(59, 130, 246, 0.06), transparent 28%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.74));
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.22);
}

.matchup-page__message,
.matchup-page__empty {
  margin: 0;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(203, 213, 225, 0.82);
}

.matchup-page__card--skeleton {
  height: 7.8rem;
  overflow: hidden;
  position: relative;
}

.matchup-page__card--skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  animation: matchup-page-shimmer 1.35s infinite;
}

.matchup-page__bot-note {
  margin: 0.65rem 0 0;
  line-height: 1.5;
  color: rgba(203, 213, 225, 0.82);
  font-size: 0.82rem;
}

.matchup-page--compact .matchup-page__content {
  max-width: 51rem;
}

.matchup-page--compact .matchup-page__hero {
  margin-bottom: 0.45rem;
  padding: 0.62rem 0.7rem;
  border-radius: 1.2rem;
}

.matchup-page--compact .matchup-page__hero-copy {
  gap: 0.8rem;
}

.matchup-page--compact .matchup-page__eyebrow {
  margin-bottom: 0.18rem;
  font-size: 0.58rem;
}

.matchup-page--compact .matchup-page__card--bot,
.matchup-page--compact .matchup-page__card--humans {
  padding: 0.68rem 0.72rem;
}

.matchup-page--compact .matchup-page__opponent-card {
  gap: 0.42rem;
  padding: 0.62rem 0.68rem;
}

.matchup-page--compact .matchup-page__stack {
  gap: 0.5rem;
  margin-top: 0.7rem;
}

.matchup-page--compact .matchup-page__top {
  gap: 0.65rem;
}

.matchup-page--compact .matchup-page__main {
  gap: 0.62rem;
}

.matchup-page--compact .matchup-page__avatar {
  width: 2rem;
  height: 2rem;
}

.matchup-page--compact .matchup-page__identity {
  gap: 0.16rem;
}

.matchup-page--compact .matchup-page__identity h2 {
  font-size: 1.02rem;
}

.matchup-page--compact .matchup-page__identity h3 {
  font-size: 0.78rem;
}

.matchup-page--compact .matchup-page__identity p {
  font-size: 0.64rem;
}

.matchup-page--compact .matchup-page__flag {
  min-height: 1.2rem;
  padding: 0.08rem 0.34rem;
  font-size: 0.58rem;
}

.matchup-page--compact .matchup-page__stat {
  gap: 0.05rem;
  padding: 0.42rem 0.48rem;
  border-radius: 0.9rem;
}

.matchup-page--compact .matchup-page__stat span {
  font-size: 0.52rem;
}

.matchup-page--compact .profile-page__showdown-vs {
  min-width: 2.1rem;
  min-height: 2.1rem;
  font-size: 0.56rem;
}


.matchup-page--compact .matchup-page__stat strong {
  font-size: 0.92rem;
}

.matchup-page--compact .matchup-page__stats {
  gap: 0.35rem;
}

.matchup-page--compact .matchup-page__stats--card {
  margin-top: 0.42rem;
}

.matchup-page--compact .matchup-page__bot-note {
  margin-top: 0.48rem;
  font-size: 0.74rem;
}

.matchup-page--compact .matchup-page__hero h1 {
  font-size: clamp(1.3rem, 3.9vw, 1.8rem);
  line-height: 0.98;
}

.matchup-page--compact .matchup-page__subtitle {
  max-width: 24rem;
  font-size: 0.72rem;
  line-height: 1.3;
}

.matchup-page--compact .matchup-page__rank {
  min-width: 3.5rem;
  min-height: 3.5rem;
  padding: 0.3rem;
}

.matchup-page--compact .matchup-page__rank span {
  font-size: 0.6rem;
}

.matchup-page--compact .matchup-page__rank strong {
  font-size: 1.32rem;
}

.matchup-page--compact .matchup-page__card--skeleton {
  height: 6.5rem;
}

.matchup-page--compact .matchup-page__duel-card {
  gap: 0.5rem;
  padding: 0.68rem;
}

.matchup-page--compact .matchup-page__section-head {
  margin-bottom: 0.54rem;
}

.matchup-page--compact .matchup-page__duel-top {
  gap: 0.44rem;
}

.matchup-page--compact .matchup-page__duel-side {
  gap: 0.48rem;
}

.matchup-page--compact .matchup-page__duel-avatar-stack {
  gap: 0.1rem;
}

.matchup-page--compact .matchup-page__duel-avatar {
  width: 3rem;
  height: 3rem;
}

.matchup-page--compact .matchup-page__duel-avatar--bot {
  width: 3.4rem;
  height: 3.4rem;
}

.matchup-page--compact .matchup-page__duel-vs {
  min-width: 1.8rem;
  min-height: 1.8rem;
  font-size: 1.28rem;
}

.matchup-page--compact .matchup-page__duel-name {
  font-size: 0.8rem;
}

.matchup-page--compact .matchup-page__duel-label {
  font-size: 0.38rem;
}

.matchup-page--compact .matchup-page__duel-wins {
  min-width: 3rem;
  padding: 0.2rem 0.28rem;
}

.matchup-page--compact .matchup-page__duel-wins span {
  font-size: 0.42rem;
}

.matchup-page--compact .matchup-page__duel-wins strong {
  font-size: 1.6rem;
}

.matchup-page--compact .matchup-page__duel-bottom {
  gap: 0.34rem;
}

.matchup-page--compact .matchup-page__duel-metric {
  padding: 0.28rem 0.34rem;
}

.matchup-page--compact .matchup-page__duel-metric span {
  font-size: 0.42rem;
}

.matchup-page--compact .matchup-page__duel-metric strong {
  font-size: 0.84rem;
}

.matchup-page--compact .matchup-page__duel-metric--center strong {
  font-size: 0.92rem;
}

@keyframes matchup-page-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 720px) {
  .matchup-page__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .matchup-page__hero-side {
    align-items: flex-start;
  }

  .matchup-page__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .matchup-page__main {
    width: 100%;
  }

  .matchup-page__rank {
    min-width: 0;
  }

  .matchup-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
