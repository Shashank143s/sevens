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
    <!-- Top bar: on mobile = banner + players side by side; on desktop = toast centered + widget top-right -->
    <div class="top-bar">
      <div
        class="turn-toast"
        :class="{ 'turn-toast--myturn': isMyTurn }"
        role="status"
        aria-live="polite"
      >
        <div class="turn-toast__inner">
          <div class="turn-toast__text">
            {{
              isMyTurn
                ? 'Your turn — play a card'
                : `Waiting for ${currentPlayerDisplay.name}...`
            }}
          </div>
          <div v-if="isMyTurn" class="turn-toast__timer">
            {{ timeLeft }}s
          </div>
        </div>
      </div>

      <!-- Right sidebar widget: collapsible; on mobile opens as popup below bar -->
      <div class="sidebar-widget">
        <button
          v-if="!sidebarOpen"
          type="button"
          class="sidebar-widget__toggle"
          aria-label="Open players"
          @click="sidebarOpen = true"
        >
          <span class="text-xl">👥</span>
          <span class="text-xs font-semibold text-slate-600">Players</span>
        </button>
        <Transition name="sidebar-panel">
          <div
            v-if="sidebarOpen"
            class="sidebar-widget__panel"
            :class="{ 'sidebar-widget__panel--mobile': isMobile }"
          >
            <div class="sidebar-widget__header">
              <span class="font-bold text-slate-800">Players</span>
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
              <div class="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
                <div
                  v-for="(hand, i) in G.hands"
                  :key="i"
                  :class="[
                    'flex items-center gap-3 p-3 rounded-2xl',
                    i === currentPlayerIndex ? 'ring-4 ring-yellow-400 bg-yellow-50' : 'bg-gray-50',
                  ]"
                >
                  <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl shadow overflow-hidden">
                    {{ getPlayerDisplay(i).avatar }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold truncate">
                      {{ i === playerIndex ? 'You' : getPlayerDisplay(i).name }}
                    </div>
                    <div v-if="!isMobile" class="text-sm text-gray-500">
                      0 ★ • {{ hand.length }} cards
                    </div>
                  </div>
                  <div v-if="!isMobile" class="text-2xl">👋</div>
                </div>
              </div>
              <div
                v-if="!isMobile"
                class="mt-4 border-t pt-4 text-xs text-gray-600 max-h-40 overflow-y-auto"
              >
                <div class="font-bold mb-2">Game Log</div>
                <div
                  v-for="(c, i) in lastPlayedCards"
                  :key="i"
                  class="mb-1"
                >
                  {{ getPlayerDisplay(i % G.hands.length).name }} played {{ (c as Card).rank }}{{ suitSymbols[(c as Card).suit] }}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="w-full flex-1 pt-16 sm:pt-20 relative">
      <!-- Central Table (full width; sidebar is a floating widget) -->
      <div class="w-full relative min-h-[720px] sm:min-h-[720px] min-h-[480px]">
        <div
          v-if="!isMobile"
          class="absolute inset-0 flex items-center justify-center overflow-auto p-2 sm:p-4"
        >
          <!-- Suit lanes (top-to-bottom): spades, hearts, diamonds, clubs -->
          <div class="flex flex-col gap-6 max-w-full">
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

        <div v-else class="absolute inset-0 flex items-center justify-center">
          <div class="w-full max-w-[420px] grid grid-cols-2 gap-3">
            <div
              v-for="p in mobileSuitCards"
              :key="p.suit"
              class="rounded-2xl bg-white/10 border border-white/15 p-3 shadow-inner"
            >
              <div class="flex items-center justify-between mb-2">
                <div
                  class="font-extrabold text-lg tracking-wide"
                  :class="p.suit === 'hearts' || p.suit === 'diamonds' ? 'text-red-200' : 'text-slate-100'"
                >
                  {{ suitSymbols[p.suit] }}
                </div>
                <div class="text-xs text-slate-100/80 tabular-nums">
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
                    :style="{
                      transform: `translateX(${idx * 8}px) rotate(${Math.min(4, idx) * 0.6}deg)`,
                      zIndex: 10 + idx,
                    }"
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
    </div>

    <!-- Bottom Hand -->
    <div class="fixed bottom-0 left-0 right-0 bg-white/30 rounded-t-xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg border border-white/40 max-w-6xl mx-auto w-full">
      <div class="flex justify-between items-center mb-3 sm:mb-4 text-base sm:text-lg font-bold text-slate-700 flex-wrap gap-2">
        <span style="color:white">Your hand</span>
        <div class="flex gap-2 text-base font-semibold">
          <button
            type="button"
            :class="[
              'px-4 py-2 rounded-xl transition',
              sortMode === 'byRank'
                ? 'bg-slate-700 text-white shadow'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300',
            ]"
            @click="sortMode = 'byRank'"
          >
            By rank
          </button>
          <button
            type="button"
            :class="[
              'px-4 py-2 rounded-xl transition',
              sortMode === 'bySuit'
                ? 'bg-slate-700 text-white shadow'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300',
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
            ? 'grid grid-rows-2 grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-3'
            : 'flex gap-3 overflow-x-auto pb-4 snap-x'
        "
      >
        <div
          v-for="card in sortedHand"
          :key="card.id"
          class="w-22 h-28 sm:w-20 sm:h-28 bg-transparent rounded-l shadow-2xl flex-shrink-0 flex items-center justify-center border-4 border-transparent cursor-grab active:cursor-grabbing sm:snap-center sm:hover:scale-100 sm:hover:rotate-3 sm:hover:z-10 active:scale-110"
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
    <button
      v-if="playerIndex === currentPlayerIndex"
      type="button"
      class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-red-500 hover:bg-red-600 text-white px-7 py-3 sm:px-10 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold shadow-2xl transition"
      @click="moves.pass()"
    >
      PASS
    </button>
  </div>
</template>

<style scoped>
/* Top bar: on mobile contains banner + players side by side; on desktop children are fixed */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  padding: 0.75rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}
.top-bar > * {
  pointer-events: auto;
}

@media (min-width: 641px) {
  .top-bar {
    display: block;
    padding: 0;
    background: transparent;
  }
  .top-bar .turn-toast {
    position: fixed;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: min(92vw, 42rem);
    flex: none;
  }
  .top-bar .sidebar-widget {
    position: fixed;
    top: 0.75rem;
    right: 0.75rem;
  }
}

@media (max-width: 640px) {
  .top-bar {
    min-height: 3.5rem;
  }
  .top-bar .turn-toast {
    position: static;
    transform: none;
    flex: 1;
    min-width: 0;
    width: auto;
    left: auto;
  }
  .top-bar .turn-toast__inner {
    justify-content: flex-start;
    padding: 0.5rem 0.75rem;
  }
  .top-bar .turn-toast__text {
    font-size: 0.9rem;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .top-bar .sidebar-widget {
    position: static;
    top: auto;
    right: auto;
    flex-shrink: 0;
  }
}

.turn-toast {
  pointer-events: none;
}
.turn-toast__inner {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.18),
    0 2px 10px rgba(0, 0, 0, 0.12);
  color: #0f172a;
}

.turn-toast__text {
  font-weight: 800;
  letter-spacing: -0.01em;
  font-size: 1.05rem;
  line-height: 1.2;
  text-align: center;
}

.turn-toast__timer {
  font-variant-numeric: tabular-nums;
  font-weight: 900;
  color: #dc2626;
  min-width: 3.5rem;
  text-align: right;
}

.turn-toast--myturn .turn-toast__inner {
  animation: turn-bounce 900ms ease-in-out 0ms 2;
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

.mobile-pile {
  min-height: 84px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.mobile-pile__empty {
  width: 61px;
  height: 84px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.mobile-pile__stack {
  position: relative;
  width: 80px;
  height: 90px;
}

.mobile-pile__card {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 69px;
  height: 99px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
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
  z-index: 50;
}

.sidebar-widget__toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 3.5rem;
  height: 3.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.sidebar-widget__toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.24);
}

.sidebar-widget__panel {
  width: 17rem;
  max-width: calc(100vw - 2rem);
  max-height: min(520px, calc(100dvh - 6rem));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1.25rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Mobile: slim popup below top bar, right-aligned, smaller type */
@media (max-width: 640px) {
  .sidebar-widget__panel--mobile {
    position: fixed;
    top: 3.5rem;
    right: 0.5rem;
    left: auto;
    width: 10.5rem;
    max-width: calc(100vw - 2rem);
    max-height: calc(100dvh - 4rem);
    border-radius: 0 0 0.875rem 0.875rem;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
  }
  .sidebar-widget__panel--mobile .sidebar-widget__header {
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__header .font-bold {
    font-size: 0.8125rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__close {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.25rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__body {
    padding: 0.5rem 0.625rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__body .space-y-3 > div,
  .sidebar-widget__panel--mobile .sidebar-widget__body .space-y-4 > div {
    padding: 0.375rem 0.5rem;
    border-radius: 0.75rem;
    gap: 0.5rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__body [class*="w-12"] {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__body .font-bold {
    font-size: 0.75rem;
  }
  .sidebar-widget__panel--mobile .sidebar-widget__body .text-sm {
    font-size: 0.6875rem;
  }
}

/* Vue transition: slide down from top */
.sidebar-panel-enter-active,
.sidebar-panel-leave-active {
  transition: transform 0.25s ease-out, opacity 0.2s ease-out;
}
.sidebar-panel-enter-from,
.sidebar-panel-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
.sidebar-panel-enter-to,
.sidebar-panel-leave-from {
  opacity: 1;
  transform: translateY(0);
}
@media (min-width: 641px) {
  .sidebar-panel-enter-from,
  .sidebar-panel-leave-to {
    transform: translateY(0);
    opacity: 0;
  }
}

.sidebar-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.sidebar-widget__close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sidebar-widget__close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #0f172a;
}

.sidebar-widget__body {
  padding: 0.75rem 1rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
</style>
