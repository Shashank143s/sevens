<script setup lang="ts">
import type { Card, Suit } from '@shared/types'
import SuitesLane from './SuitesLane.vue'
import backgroundGame from '~/assets/images/poker_cards_table.png'

type PileLike = { started?: boolean; low: number | null; high: number | null }

/** Mirror of server isPlayable: can this card be played on this pile? */
function isPlayable(card: Card, pile: PileLike): boolean {
  const started = pile.started ?? (pile.low != null || pile.high != null)
  if (!started) return card.rank === 7
  return (
    card.rank === (pile.low ?? 0) - 1 ||
    card.rank === (pile.high ?? 0) + 1
  )
}

/** Cards from hand that are legal to play. */
function getPlayableCards(
  hand: Card[],
  piles: Record<Suit, PileLike>,
): Card[] {
  return hand.filter((card) => isPlayable(card, piles[card.suit]))
}

export interface PlayerInfo {
  id: number
  name?: string | null
  avatar?: string
}

const props = defineProps<{
  G: {
    piles: Record<Suit, { started?: boolean; low: number | null; high: number | null }>
    hands: Card[][]
    playedCards?: Card[]
  }
  ctx: { currentPlayer: string }
  moves: Record<string, (...args: unknown[]) => void>
  playerId: string | null
  players?: PlayerInfo[]
}>()

const { G, ctx, moves, playerId } = toRefs(props)

const playerIndex = computed(() =>
  playerId.value != null ? parseInt(playerId.value, 10) : -1
)
const currentPlayerIndex = computed(() =>
  parseInt(ctx.value.currentPlayer, 10)
)
const myHand = computed(() => {
  const idx = playerIndex.value
  return idx >= 0 ? (G.value.hands[idx] || []) : []
})

const isPlayableCardAvailable = computed(() => getPlayableCards(myHand.value, G.value.piles).length > 0)

type SortMode = 'byRank' | 'bySuit'
const sortMode = ref<SortMode>('byRank')
const sidebarOpen = ref(true)

const SUIT_ORDER: Record<Suit, number> = {
  spades: 0,
  hearts: 1,
  diamonds: 2,
  clubs: 3,
}

const sortedHand = computed(() => {
  const hand = [...myHand.value]
  if (sortMode.value === 'byRank') {
    return hand.sort((a, b) => a.rank - b.rank)
  }
  return hand.sort((a, b) => {
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]
    return suitDiff !== 0 ? suitDiff : a.rank - b.rank
  })
})

const isMyTurn = computed(
  () => playerIndex.value >= 0 && playerIndex.value === currentPlayerIndex.value,
)

const currentPlayerDisplay = computed(() => getPlayerDisplay(currentPlayerIndex.value))
const topBarMessage = computed(() =>
  isMyTurn.value
    ? 'Your turn - play a card'
    : `Waiting for ${currentPlayerDisplay.value.name}...`,
)
const isLowTime = computed(() => isMyTurn.value && timeLeft.value <= 7)
const isCriticalTime = computed(() => isMyTurn.value && timeLeft.value <= 3)

const TURN_SECONDS = 30
const timeLeft = ref(TURN_SECONDS)
let turnTimer: ReturnType<typeof setInterval> | null = null

function clearTurnTimer() {
  if (turnTimer != null) {
    clearInterval(turnTimer)
    turnTimer = null
  }
}

function runAutoPlayOrPass() {
  clearTurnTimer()
  const cards = getPlayableCards(myHand.value, G.value.piles as Record<Suit, PileLike>)
  if (cards.length > 0) {
    moves.value.playCard(cards[0])
  } else {
    moves.value.pass()
  }
}

watch(
  [isMyTurn, currentPlayerIndex],
  () => {
    clearTurnTimer()
    if (!isMyTurn.value) {
      timeLeft.value = TURN_SECONDS
      return
    }
    timeLeft.value = TURN_SECONDS
    turnTimer = setInterval(() => {
      timeLeft.value -= 1
      if (timeLeft.value <= 0) {
        runAutoPlayOrPass()
      }
    }, 1000)
  },
  { immediate: true },
)

onUnmounted(clearTurnTimer)

const suitSymbols: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const ranks = Array.from({ length: 13 }, (_, i) => i + 1)

const getCardImageSrc = (card: { suit: Suit; rank: number }) =>
  new URL(`../assets/images/cards/${card.suit}-${card.rank}.png`, import.meta.url).href

const lastPlayedCards = computed(() => (G.value.playedCards ?? []).slice(-5))

const mobileSuitCards = computed(() => {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
  return suits.map((suit) => {
    const pile = G.value.piles[suit] as PileLike
    const started = pile.started ?? (pile.low != null || pile.high != null)
    const ranksOut: number[] = []
    if (started && pile.low != null && pile.high != null) {
      for (let r = pile.low; r <= pile.high; r++) ranksOut.push(r)
    }
    return {
      suit,
      ranks: ranksOut,
      low: pile.low,
      high: pile.high,
    }
  })
})

function getMobilePileCardStyle(idx: number, count: number) {
  const cardWidthPercent = 40

  if (count <= 1) {
    return {
      left: '50%',
      width: `${cardWidthPercent}%`,
      transform: 'translateX(-50%)',
      zIndex: 10,
    }
  }

  const maxLeftPercent = 100 - cardWidthPercent
  const leftPercent = count > 1 ? (idx * maxLeftPercent) / (count - 1) : 0
  return {
    left: `${leftPercent}%`,
    width: `${cardWidthPercent}%`,
    transform: `rotate(${Math.min(4, idx) * 0.6}deg)`,
    zIndex: 10 + idx,
  }
}

function getPlayerDisplay(index: number) {
  const list = props.players
  const p = list?.find((x) => x.id === index) ?? list?.[index]
  return {
    name: p?.name ?? `Player ${index}`,
    avatar: p?.avatar ?? '👤',
  }
}

const isMobile = ref(false)
let mobileMql: MediaQueryList | null = null
let onMobileMqlChange: ((e: MediaQueryListEvent) => void) | null = null

onMounted(() => {
  if (typeof window === 'undefined') return
  mobileMql = window.matchMedia('(max-width: 640px)')
  const set = (v: boolean) => (isMobile.value = v)
  set(mobileMql.matches)
  onMobileMqlChange = (e) => set(e.matches)
  mobileMql.addEventListener?.('change', onMobileMqlChange)
})

onUnmounted(() => {
  if (mobileMql && onMobileMqlChange) {
    mobileMql.removeEventListener?.('change', onMobileMqlChange)
  }
})
</script>

<template>
  <div
    class="fixed inset-0 bg-cover bg-center p-2 sm:p-4 font-sans flex flex-col"
    :style="{
      backgroundImage: `url(${backgroundGame})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }"
  >
    <div class="board-stage w-full flex-1 relative">
      <div
        v-if="!isMobile"
        class="board-stage__desktop absolute inset-0 flex items-center justify-center overflow-auto"
      >
        <!-- Suit lanes (top-to-bottom): spades, hearts, diamonds, clubs -->
        <div class="desktop-table flex flex-col max-w-full">
          <SuitesLane
            suit="spades"
            :pile="G.piles.spades"
            :ranks="ranks"
            :getCardImageSrc="getCardImageSrc"
          />
          <SuitesLane
            suit="hearts"
            :pile="G.piles.hearts"
            :ranks="ranks"
            :getCardImageSrc="getCardImageSrc"
          />
          <SuitesLane
            suit="diamonds"
            :pile="G.piles.diamonds"
            :ranks="ranks"
            :getCardImageSrc="getCardImageSrc"
          />
          <SuitesLane
            suit="clubs"
            :pile="G.piles.clubs"
            :ranks="ranks"
            :getCardImageSrc="getCardImageSrc"
          />
        </div>
      </div>

      <div v-else class="board-stage__mobile absolute inset-0 flex items-center justify-center">
        <div class="w-full max-w-[420px] grid grid-cols-2 gap-3">
          <div
            v-for="p in mobileSuitCards"
            :key="p.suit"
            class="rounded-2xl border p-3 backdrop-blur-sm"
            :class="p.suit === 'hearts' || p.suit === 'diamonds'
              ? 'border-red-400/55 bg-[linear-gradient(180deg,rgba(69,10,10,0.78),rgba(30,41,59,0.9))] shadow-[0_22px_48px_rgba(248,113,113,0.24),inset_0_1px_0_rgba(254,202,202,0.16)]'
              : 'border-slate-200/30 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))] shadow-[0_22px_48px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]'"
          >
            <div class="flex items-center justify-between">
              <div
                class="font-extrabold text-[1.75rem] tracking-wide"
                :class="p.suit === 'hearts' || p.suit === 'diamonds'
                  ? 'text-red-300 [text-shadow:0_0_18px_rgba(252,165,165,0.75)]'
                  : 'text-slate-50 [text-shadow:0_0_18px_rgba(255,255,255,0.45)]'"
              >
                {{ suitSymbols[p.suit] }}
              </div>
              <div class="text-xs text-slate-300 tabular-nums">
                <span v-if="p.ranks.length">
                  {{ p.ranks[0] }}–{{ p.ranks[p.ranks.length - 1] }}
                </span>
                <span v-else>—</span>
              </div>
            </div>

            <div class="mobile-pile">
              <div v-if="p.ranks.length === 0" class="mobile-pile__empty" />
              <div v-else class="mobile-pile__stack" aria-hidden="true">
                  <div
                    v-for="(rank, idx) in p.ranks"
                    :key="`${p.suit}-${rank}`"
                    class="mobile-pile__card"
                    :style="getMobilePileCardStyle(idx, p.ranks.length)"
                  >
                  <img
                    :src="getCardImageSrc({ suit: p.suit, rank })"
                    :alt="`${rank} of ${p.suit}`"
                    class="mobile-pile__img"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Hand -->
    <div class="fixed bottom-0 left-0 right-0 max-w-6xl mx-auto w-full rounded-t-[1.75rem] border border-amber-200/15 bg-slate-900/72 px-4 sm:px-6 py-3 sm:py-4 shadow-[0_-18px_45px_rgba(2,6,23,0.42)] backdrop-blur-xl">
      <div class="flex justify-between items-center mb-3 sm:mb-4 text-base sm:text-lg font-bold text-slate-100 flex-wrap gap-2">
        <span class="text-white">Your hand</span>
        <div class="flex gap-2 text-sm font-semibold">
          <button
            type="button"
            :class="[
              'px-3 py-1 rounded-lg border transition',
              sortMode === 'byRank'
                ? 'border-amber-300/30 bg-amber-400/20 text-amber-50 shadow-[0_8px_22px_rgba(245,158,11,0.16)]'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
            ]"
            @click="sortMode = 'byRank'"
          >
            By rank
          </button>
          <button
            type="button"
            :class="[
              'px-3 py-1 rounded-lg border transition',
              sortMode === 'bySuit'
                ? 'border-amber-300/30 bg-amber-400/20 text-amber-50 shadow-[0_8px_22px_rgba(245,158,11,0.16)]'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
            ]"
            @click="sortMode = 'bySuit'"
          >
            By suit
          </button>
        </div>
      </div>
      <div
        :class="
          isMobile
            ? 'grid grid-rows-2 grid-flow-col auto-cols-max gap-1 overflow-x-auto'
            : 'flex gap-1 overflow-x-auto pb-4 snap-x'
        "
      >
        <div
          v-for="card in sortedHand"
          :key="card.id"
          class="w-16 h-24 sm:w-28 sm:h-36 bg-transparent rounded-l shadow-2xl flex-shrink-0 flex items-center justify-center border-4 border-transparent cursor-grab active:cursor-grabbing sm:snap-center sm:hover:scale-100 sm:hover:rotate-3 sm:hover:z-10 active:scale-110"
          @click="playerIndex === currentPlayerIndex && moves.playCard(card)"
        >
          <img
            :src="getCardImageSrc(card)"
            :alt="`${card.rank} of ${card.suit}`"
            class="w-full h-full rounded-l shadow-xl object-contain"
          >
        </div>
      </div>
    </div>

    <!-- Pass Button -->
     <Motion preset="slideTop">
        <button
          is="button"
          v-if="playerIndex === currentPlayerIndex && !isPlayableCardAvailable && myHand.length > 0"
          type="button"
          class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-red-500 bg-opacity-90 hover:bg-red-600 text-white px-5 py-2 sm:px-8 sm:py-3 rounded-xl text-base sm:text-lg font-bold shadow-xl transition"
          @click="moves.pass()"
        >
          PASS
      </button>
     </Motion>  
  </div>

  <Teleport to="body">
    <div class="top-bar">
      <div
        class="turn-toast"
        :class="{
          'turn-toast--myturn': isMyTurn,
          'turn-toast--low': isLowTime,
          'turn-toast--critical': isCriticalTime,
        }"
        role="status"
        aria-live="polite"
      >
        <div class="turn-toast__inner">
          <div class="turn-toast__text">
            {{ topBarMessage }}
          </div>
          <div v-if="isMyTurn" class="turn-toast__timer">
            {{ timeLeft }}s
          </div>
        </div>
      </div>

      <div class="sidebar-widget">
        <button
          type="button"
          class="sidebar-widget__toggle"
          :class="{ 'sidebar-widget__toggle--open': sidebarOpen }"
          aria-label="Open players"
          :aria-expanded="sidebarOpen ? 'true' : 'false'"
          @click="sidebarOpen = !sidebarOpen"
        >
          <span class="sidebar-widget__toggle-icon">👥</span>
          <span class="sidebar-widget__toggle-label">Players</span>
          <span class="sidebar-widget__toggle-count">{{ G.hands.length }}</span>
        </button>
        <Transition name="sidebar-panel">
          <div
            v-if="sidebarOpen"
            class="sidebar-widget__panel"
            :class="{ 'sidebar-widget__panel--mobile': isMobile }"
          >
            <div class="sidebar-widget__header">
              <div>
                <div class="sidebar-widget__eyebrow">Table</div>
                <span class="sidebar-widget__title">Players</span>
              </div>
              <button
                type="button"
                class="sidebar-widget__close"
                aria-label="Collapse"
                @click="sidebarOpen = false"
              >
                ×
              </button>
            </div>
            <div class="sidebar-widget__body">
              <div class="sidebar-widget__list">
                <div
                  v-for="(hand, i) in G.hands"
                  :key="i"
                  class="player-chip"
                  :class="{
                    'player-chip--active': i === currentPlayerIndex,
                    'player-chip--self': i === playerIndex,
                  }"
                >
                  <div class="player-chip__avatar">
                    {{ getPlayerDisplay(i).avatar }}
                  </div>
                  <div class="player-chip__content">
                    <div class="player-chip__name">
                      {{ i === playerIndex ? 'You' : getPlayerDisplay(i).name }}
                    </div>
                    <div class="player-chip__meta">
                      <span>{{ hand.length }} cards</span>
                      <span v-if="i === currentPlayerIndex">On turn</span>
                    </div>
                  </div>
                  <div class="player-chip__status">
                    {{ i === currentPlayerIndex ? '●' : '○' }}
                  </div>
                </div>
              </div>
              <div v-if="!isMobile && lastPlayedCards.length" class="sidebar-widget__log">
                <div class="sidebar-widget__log-title">Recent Plays</div>
                <div
                  v-for="(c, i) in lastPlayedCards"
                  :key="i"
                  class="sidebar-widget__log-item"
                >
                  {{ getPlayerDisplay(i % G.hands.length).name }} played {{ (c as Card).rank }}{{ suitSymbols[(c as Card).suit] }}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.board-stage__mobile {
  padding: 3.5rem 0.75rem 13.5rem;
  overflow-y: auto;
}

.desktop-table {
  gap: 1.25rem;
}

.top-bar {
  position: fixed;
  top: max(0.35rem, env(safe-area-inset-top));
  left: 0.75rem;
  right: 0.75rem;
  z-index: 80;
  width: min(calc(100vw - 1.5rem), 42rem);
  margin: 0 auto;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  pointer-events: none;
}

.top-bar > * {
  pointer-events: auto;
}

.turn-toast {
  width: min(calc(100% - 5.75rem), 34rem);
  flex: 0 1 auto;
}

.turn-toast__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  min-height: 3.5rem;
  padding: 0.7rem 1rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(255, 236, 179, 0.18);
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.82)),
    rgba(15, 23, 42, 0.86);
  backdrop-filter: blur(16px);
  box-shadow:
    0 20px 45px rgba(2, 6, 23, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: #f8fafc;
}

.turn-toast__text {
  font-weight: 800;
  letter-spacing: -0.02em;
  font-size: 0.96rem;
  line-height: 1.15;
  text-align: left;
}

.turn-toast__timer {
  font-variant-numeric: tabular-nums;
  font-weight: 900;
  color: #fef3c7;
  min-width: 3.2rem;
  text-align: right;
  font-size: 1.05rem;
  letter-spacing: -0.03em;
}

.turn-toast--myturn .turn-toast__inner {
  animation: turn-bounce 900ms ease-in-out 0ms 2;
}

.turn-toast--low .turn-toast__inner {
  border-color: rgba(248, 113, 113, 0.5);
  background:
    linear-gradient(135deg, rgba(69, 10, 10, 0.95), rgba(127, 29, 29, 0.84)),
    rgba(69, 10, 10, 0.86);
  box-shadow:
    0 22px 48px rgba(127, 29, 29, 0.34),
    0 0 0 1px rgba(252, 165, 165, 0.15);
}

.turn-toast--critical .turn-toast__inner {
  animation: turn-critical-pulse 850ms ease-in-out infinite;
}

@keyframes turn-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  35% {
    transform: translateY(-6px);
  }
  65% {
    transform: translateY(0);
  }
}

@keyframes turn-critical-pulse {
  0%,
  100% {
    box-shadow:
      0 22px 48px rgba(127, 29, 29, 0.34),
      0 0 0 0 rgba(248, 113, 113, 0.32);
  }
  50% {
    box-shadow:
      0 24px 54px rgba(153, 27, 27, 0.45),
      0 0 0 8px rgba(248, 113, 113, 0.05);
  }
}

.mobile-pile {
  min-height: clamp(86px, 24vw, 108px);
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}

.mobile-pile__empty {
  width: 52px;
  aspect-ratio: 500 / 726;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.34);
  border: 1px solid rgba(255, 236, 179, 0.12);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 8px 18px rgba(2, 6, 23, 0.14);
}

.mobile-pile__stack {
  position: relative;
  width: 100%;
  height: clamp(86px, 24vw, 108px);
  overflow: hidden;
}

.mobile-pile__card {
  position: absolute;
  bottom: 0;
  width: 40%;
  aspect-ratio: 500 / 726;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 14px 34px rgba(2, 6, 23, 0.28),
    0 0 0 1px rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.mobile-pile__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Sidebar widget: top-right on desktop; in top bar on mobile */
.sidebar-widget {
  position: relative;
  z-index: 85;
  flex-shrink: 0;
}

.sidebar-widget__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 3.5rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid rgba(255, 236, 179, 0.16);
  border-radius: 1.1rem;
  background: rgba(15, 23, 42, 0.84);
  backdrop-filter: blur(16px);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.3);
  cursor: pointer;
  color: #f8fafc;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}
.sidebar-widget__toggle:hover {
  transform: translateY(-1px);
  background: rgba(30, 41, 59, 0.92);
  box-shadow: 0 22px 44px rgba(2, 6, 23, 0.36);
}

.sidebar-widget__toggle--open {
  background: rgba(30, 41, 59, 0.96);
  box-shadow: 0 22px 44px rgba(2, 6, 23, 0.36);
}

.sidebar-widget__toggle-icon {
  font-size: 1rem;
}

.sidebar-widget__toggle-label {
  font-size: 0.8rem;
  font-weight: 700;
}

.sidebar-widget__toggle-count {
  min-width: 1.6rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.2);
  color: #fde68a;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
}

.sidebar-widget__panel {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  width: 18rem;
  max-width: calc(100vw - 2rem);
  max-height: min(520px, calc(100dvh - 5.5rem));
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 236, 179, 0.12);
  border-radius: 1.3rem;
  box-shadow: 0 24px 54px rgba(2, 6, 23, 0.38);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (min-width: 641px) {
  .board-stage {
    padding: 0.75rem 0 14.5rem;
  }

  .board-stage__desktop {
    padding: 0.75rem 1.25rem 1rem;
  }

  .desktop-table {
    width: fit-content;
    min-width: max-content;
    max-width: 100%;
    margin: 0 auto;
    gap: 1.5rem;
  }

  .top-bar {
    left: 0;
    right: 0;
    width: 100%;
    max-width: none;
    padding: 0 0.75rem;
    justify-content: center;
  }

  .turn-toast {
    width: min(34rem, calc(100vw - 22rem));
    flex: 0 1 auto;
  }

  .sidebar-widget {
    position: fixed;
    top: max(0.35rem, env(safe-area-inset-top));
    right: 0.75rem;
  }
}

@media (max-width: 640px) {
  .board-stage {
    padding-top: 0;
  }

  .board-stage__mobile {
    align-items: flex-start;
    justify-content: center;
  }

  .top-bar {
    left: 0.5rem;
    right: 0.5rem;
    width: calc(100vw - 1rem);
    align-items: center;
  }
  .turn-toast {
    width: calc(100% - 4.85rem);
    flex: 0 1 auto;
  }
  .turn-toast__inner {
    gap: 0.6rem;
    min-height: 3rem;
    padding: 0.55rem 0.75rem;
    border-radius: 1rem;
  }
  .turn-toast__text {
    font-size: 0.82rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .turn-toast__timer {
    min-width: 2.5rem;
    font-size: 0.95rem;
  }
  .sidebar-widget {
    position: relative;
  }
  .sidebar-widget__toggle {
    gap: 0.4rem;
    min-height: 3rem;
    padding: 0.55rem 0.7rem;
  }
  .sidebar-widget__toggle-label {
    display: none;
  }
  .sidebar-widget__panel--mobile {
    position: absolute;
    top: calc(100% + 0.45rem);
    right: 0;
    left: auto;
    width: 15rem;
    max-width: calc(100vw - 2rem);
    max-height: calc(100dvh - 5rem);
    border-radius: 1rem;
    box-shadow: 0 18px 40px rgba(2, 6, 23, 0.34);
  }
  .sidebar-widget__panel--mobile .sidebar-widget__header {
    padding: 0.75rem 0.85rem 0.65rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__close {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.25rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__body {
    padding: 0 0.85rem 0.85rem;
  }
}

.sidebar-panel-enter-active,
.sidebar-panel-leave-active {
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
  transform-origin: top right;
}
.sidebar-panel-enter-from,
.sidebar-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.96);
}
.sidebar-panel-enter-to,
.sidebar-panel-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.sidebar-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.95rem 1rem 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.sidebar-widget__eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(253, 230, 138, 0.72);
}

.sidebar-widget__title {
  font-size: 1rem;
  font-weight: 800;
  color: #f8fafc;
}

.sidebar-widget__close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  line-height: 1;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.7rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sidebar-widget__close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.sidebar-widget__body {
  padding: 0 1rem 1rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.sidebar-widget__list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.player-chip {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
}

.player-chip--active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(251, 191, 36, 0.08));
  border-color: rgba(245, 158, 11, 0.35);
  box-shadow: inset 0 0 0 1px rgba(253, 224, 71, 0.1);
}

.player-chip--self {
  border-color: rgba(148, 163, 184, 0.24);
}

.player-chip__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.95rem;
  background: linear-gradient(135deg, rgba(71, 85, 105, 0.95), rgba(30, 41, 59, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.player-chip__content {
  min-width: 0;
  flex: 1;
}

.player-chip__name {
  font-size: 0.82rem;
  font-weight: 800;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-chip__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.4rem;
  margin-top: 0.1rem;
  font-size: 0.64rem;
  color: #94a3b8;
}

.player-chip__status {
  font-size: 0.82rem;
  color: #f59e0b;
}

.sidebar-widget__log {
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-widget__log-title {
  margin-bottom: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(253, 230, 138, 0.72);
}

.sidebar-widget__log-item {
  font-size: 0.76rem;
  line-height: 1.45;
  color: #cbd5e1;
}
</style>
