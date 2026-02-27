<script setup lang="ts">
import type { Card, Suit } from '@shared/types'

const props = defineProps<{
  G: {
    piles: Record<Suit, { low: number; high: number }>
    hands: Card[][]
    playedCards: Card[]
  }
  ctx: { currentPlayer: string }
  moves: Record<string, (...args: unknown[]) => void>
  playerID: string | null
}>()

const { G, ctx, moves, playerID } = toRefs(props)

const playerIndex = computed(() =>
  playerID.value != null ? parseInt(playerID.value, 10) : -1
)
const currentPlayerIndex = computed(() =>
  parseInt(ctx.value.currentPlayer, 10)
)
const myHand = computed(() => {
  const idx = playerIndex.value
  return idx >= 0 ? (G.value.hands[idx] || []) : []
})

const suitSymbols: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const ranks = Array.from({ length: 13 }, (_, i) => i + 1)

const getCardImageSrc = (card: { suit: Suit; rank: number }) =>
  `/cards/${card.suit}-${card.rank}.png`

const lastPlayedCards = computed(() => G.value.playedCards.slice(-5))
</script>

<template>
  <div
    class="fixed inset-0 bg-cover bg-center p-2 sm:p-4 font-sans flex flex-col min-h-[100dvh] safe-area-padding overflow-hidden"
    style="
      background-image: url('https://assets.sevens.game/wood-bg.jpg');
      background-size: cover;
      background-position: center;
    "
  >
    <!-- Top Banner -->
    <div class="bg-white/90 text-center py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow mb-3 sm:mb-6 text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 flex items-center justify-center gap-2 sm:gap-4 flex-wrap shrink-0">
      {{ playerIndex === currentPlayerIndex ? '🕒 You must play a card' : 'Waiting for player...' }}
      <div v-if="playerIndex === currentPlayerIndex" class="text-xl sm:text-2xl md:text-3xl font-mono text-red-500">
        29s
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-3 sm:gap-6 max-w-7xl mx-auto flex-1 min-h-0 overflow-hidden">
      <!-- Central Table -->
      <div class="flex-1 relative min-h-[280px] sm:min-h-[340px] md:min-h-[400px] lg:min-h-[460px] overflow-auto shrink-0">
        <!-- Hearts vertical column -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div class="flex flex-col items-center gap-0.5 sm:gap-1 md:gap-2">
            <div
              v-for="rank in ranks"
              :key="`hearts-${rank}`"
              class="card-slot rounded flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.hearts.low && rank <= G.piles.hearts.high"
                is="img"
                :src="getCardImageSrc({ suit: 'hearts', rank })"
                :alt="`${rank} of hearts`"
                class="w-full h-full rounded shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div
                v-else
                class="w-full h-full rounded bg-white/10 shadow-inner"
              />
            </div>
          </div>
        </div>

        <!-- Spades lane -->
        <div class="absolute left-1/2 -translate-x-1/2 top-2 sm:top-6 md:top-10">
          <div class="flex gap-0.5 sm:gap-1 md:gap-2">
            <div
              v-for="rank in ranks"
              :key="`spades-${rank}`"
              class="card-slot rounded flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.spades.low && rank <= G.piles.spades.high"
                is="img"
                :src="getCardImageSrc({ suit: 'spades', rank })"
                :alt="`${rank} of spades`"
                class="w-full h-full rounded shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div v-else class="w-full h-full rounded bg-white/10 shadow-inner" />
            </div>
          </div>
        </div>

        <!-- Diamonds lane -->
        <div class="absolute left-1/2 -translate-x-1/2 top-1/2 translate-y-8 sm:translate-y-14 md:translate-y-20">
          <div class="flex gap-0.5 sm:gap-1 md:gap-2">
            <div
              v-for="rank in ranks"
              :key="`diamonds-${rank}`"
              class="card-slot rounded flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.diamonds.low && rank <= G.piles.diamonds.high"
                is="img"
                :src="getCardImageSrc({ suit: 'diamonds', rank })"
                :alt="`${rank} of diamonds`"
                class="w-full h-full rounded shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div v-else class="w-full h-full rounded bg-white/10 shadow-inner" />
            </div>
          </div>
        </div>

        <!-- Clubs lane -->
        <div class="absolute left-1/2 -translate-x-1/2 bottom-1 sm:bottom-2 md:bottom-4">
          <div class="flex gap-0.5 sm:gap-1 md:gap-2">
            <div
              v-for="rank in ranks"
              :key="`clubs-${rank}`"
              class="card-slot rounded flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.clubs.low && rank <= G.piles.clubs.high"
                is="img"
                :src="getCardImageSrc({ suit: 'clubs', rank })"
                :alt="`${rank} of clubs`"
                class="w-full h-full rounded shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div v-else class="w-full h-full rounded bg-white/10 shadow-inner" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="w-full lg:w-80 bg-white/95 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl p-3 sm:p-4 flex flex-col h-[200px] sm:h-[280px] lg:h-[520px] shrink-0">
        <div class="space-y-2 sm:space-y-4 flex-1 overflow-y-auto min-h-0">
          <div
            v-for="(hand, i) in G.hands"
            :key="i"
            :class="[
              'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl',
              i === currentPlayerIndex ? 'ring-2 sm:ring-4 ring-yellow-400 bg-yellow-50' : 'bg-gray-50',
            ]"
          >
            <div class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl shadow shrink-0">
              👤
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm sm:text-base truncate">
                {{ i === 0 ? 'You' : `Player ${i}` }}
              </div>
              <div class="text-xs sm:text-sm text-gray-500">
                0 ★ • {{ hand.length }} cards
              </div>
            </div>
            <div class="text-lg sm:text-xl lg:text-2xl shrink-0">👋</div>
          </div>
        </div>

        <div class="mt-2 sm:mt-4 border-t pt-2 sm:pt-4 text-xs text-gray-600 max-h-24 sm:max-h-40 overflow-y-auto shrink-0">
          <div class="font-bold mb-2">Game Log</div>
          <div
            v-for="(c, i) in lastPlayedCards"
            :key="i"
            class="mb-1"
          >
            Player {{ i % 3 }} played {{ (c as Card).rank }}{{ suitSymbols[(c as Card).suit] }}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Hand -->
    <div class="mt-4 sm:mt-6 lg:mt-10 bg-white/70 rounded-lg sm:rounded-xl px-3 sm:px-6 py-3 sm:py-4 shadow-lg border border-white/40 max-w-6xl mx-auto shrink-0">
      <div class="flex justify-between mb-2 sm:mb-4 text-sm sm:text-base lg:text-lg font-bold text-slate-700 gap-2">
        <span>My hand</span>
        <span class="text-blue-600 cursor-pointer text-xs sm:text-base shrink-0">Sort cards ↓</span>
      </div>
      <div class="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-4 snap-x snap-mandatory -mx-1 sm:mx-0">
        <div
          v-for="card in myHand"
          :key="card.id"
          class="hand-card w-14 h-20 sm:w-16 sm:h-24 lg:w-20 lg:h-28 bg-transparent rounded-xl sm:rounded-2xl shadow-2xl flex-shrink-0 flex items-center justify-center border-2 sm:border-4 border-transparent cursor-grab active:cursor-grabbing snap-center hover:scale-110 hover:rotate-3 hover:z-50 active:scale-95 touch-manipulation"
          @click="playerIndex === currentPlayerIndex && moves.playCard(card)"
        >
          <img
            :src="getCardImageSrc(card)"
            :alt="`${card.rank} of ${card.suit}`"
            class="w-full h-full rounded-xl sm:rounded-2xl shadow-xl object-contain"
          >
        </div>
      </div>
    </div>

    <!-- Pass Button -->
    <button
      v-if="playerIndex === currentPlayerIndex"
      type="button"
      class="fixed bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-xl font-bold shadow-2xl transition touch-manipulation"
      style="bottom: calc(1rem + env(safe-area-inset-bottom, 0)); right: calc(1rem + env(safe-area-inset-right, 0));"
      @click="moves.pass()"
    >
      PASS
    </button>
  </div>
</template>

<style scoped>
/* Responsive card slot sizes for table piles */
.card-slot {
  width: 24px;
  height: 36px;
}
@media (min-width: 640px) {
  .card-slot {
    width: 32px;
    height: 48px;
  }
}
@media (min-width: 768px) {
  .card-slot {
    width: 40px;
    height: 60px;
  }
}
@media (min-width: 1024px) {
  .card-slot {
    width: 48px;
    height: 72px;
  }
}
@media (min-width: 1280px) {
  .card-slot {
    width: 56px;
    height: 84px;
  }
}
@media (min-width: 1536px) {
  .card-slot {
    width: 64px;
    height: 96px;
  }
}
</style>
