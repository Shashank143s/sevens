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
    class="fixed inset-0 bg-cover bg-center p-4 font-sans flex flex-col"
    style="
      background-image: url('https://assets.sevens.game/wood-bg.jpg');
      background-size: cover;
      background-position: center;
    "
  >
    <!-- Top Banner -->
    <div class="bg-white/90 text-center py-3 rounded-2xl shadow mb-6 text-2xl font-bold text-slate-800 flex items-center justify-center gap-4">
      {{ playerIndex === currentPlayerIndex ? '🕒 You must play a card' : 'Waiting for player...' }}
      <div v-if="playerIndex === currentPlayerIndex" class="text-3xl font-mono text-red-500">
        29s
      </div>
    </div>

    <div class="flex gap-6 max-w-7xl mx-auto flex-1">
      <!-- Central Table -->
      <div class="flex-1 relative min-h-[460px]">
        <!-- Hearts vertical column -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div class="flex flex-col items-center gap-2">
            <div
              v-for="rank in ranks"
              :key="`hearts-${rank}`"
              class="w-16 h-24 rounded-md flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.hearts.low && rank <= G.piles.hearts.high"
                is="img"
                :src="getCardImageSrc({ suit: 'hearts', rank })"
                :alt="`${rank} of hearts`"
                class="w-full h-full rounded-md shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div
                v-else
                class="w-full h-full rounded-md bg-white/10 shadow-inner"
              />
            </div>
          </div>
        </div>

        <!-- Spades lane -->
        <div class="absolute left-1/2 -translate-x-1/2 top-10">
          <div class="flex gap-2">
            <div
              v-for="rank in ranks"
              :key="`spades-${rank}`"
              class="w-16 h-24 rounded-md flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.spades.low && rank <= G.piles.spades.high"
                is="img"
                :src="getCardImageSrc({ suit: 'spades', rank })"
                :alt="`${rank} of spades`"
                class="w-full h-full rounded-md shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div v-else class="w-full h-full rounded-md bg-white/10 shadow-inner" />
            </div>
          </div>
        </div>

        <!-- Diamonds lane -->
        <div class="absolute left-1/2 -translate-x-1/2 top-1/2 translate-y-20">
          <div class="flex gap-2">
            <div
              v-for="rank in ranks"
              :key="`diamonds-${rank}`"
              class="w-16 h-24 rounded-md flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.diamonds.low && rank <= G.piles.diamonds.high"
                is="img"
                :src="getCardImageSrc({ suit: 'diamonds', rank })"
                :alt="`${rank} of diamonds`"
                class="w-full h-full rounded-md shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div v-else class="w-full h-full rounded-md bg-white/10 shadow-inner" />
            </div>
          </div>
        </div>

        <!-- Clubs lane -->
        <div class="absolute left-1/2 -translate-x-1/2 bottom-4">
          <div class="flex gap-2">
            <div
              v-for="rank in ranks"
              :key="`clubs-${rank}`"
              class="w-16 h-24 rounded-md flex items-center justify-center"
            >
              <Motion
                v-if="rank >= G.piles.clubs.low && rank <= G.piles.clubs.high"
                is="img"
                :src="getCardImageSrc({ suit: 'clubs', rank })"
                :alt="`${rank} of clubs`"
                class="w-full h-full rounded-md shadow-lg bg-white object-contain"
                :initial="{ scale: 0.92, y: -6 }"
                :enter="{ scale: 1, y: 0 }"
              />
              <div v-else class="w-full h-full rounded-md bg-white/10 shadow-inner" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="w-80 bg-white/95 rounded-3xl shadow-xl p-4 flex flex-col h-[520px]">
        <div class="space-y-4 flex-1 overflow-y-auto">
          <div
            v-for="(hand, i) in G.hands"
            :key="i"
            :class="[
              'flex items-center gap-3 p-3 rounded-2xl',
              i === currentPlayerIndex ? 'ring-4 ring-yellow-400 bg-yellow-50' : 'bg-gray-50',
            ]"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl shadow">
              👤
            </div>
            <div class="flex-1">
              <div class="font-bold">
                {{ i === 0 ? 'You' : `Player ${i}` }}
              </div>
              <div class="text-sm text-gray-500">
                0 ★ • {{ hand.length }} cards
              </div>
            </div>
            <div class="text-2xl">👋</div>
          </div>
        </div>

        <div class="mt-4 border-t pt-4 text-xs text-gray-600 max-h-40 overflow-y-auto">
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
    <div class="mt-10 bg-white/70 rounded-xl px-6 py-4 shadow-lg border border-white/40 max-w-6xl mx-auto">
      <div class="flex justify-between mb-4 text-lg font-bold text-slate-700">
        <span>My hand</span>
        <span class="text-blue-600 cursor-pointer">Sort cards by number ↓</span>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-4 snap-x">
        <div
          v-for="card in myHand"
          :key="card.id"
          class="w-20 h-28 bg-transparent rounded-2xl shadow-2xl flex-shrink-0 flex items-center justify-center border-4 border-transparent cursor-grab active:cursor-grabbing snap-center hover:scale-110 hover:rotate-3 hover:z-50 active:scale-95"
          @click="playerIndex === currentPlayerIndex && moves.playCard(card)"
        >
          <img
            :src="getCardImageSrc(card)"
            :alt="`${card.rank} of ${card.suit}`"
            class="w-full h-full rounded-2xl shadow-xl object-contain"
          >
        </div>
      </div>
    </div>

    <!-- Pass Button -->
    <button
      v-if="playerIndex === currentPlayerIndex"
      type="button"
      class="fixed bottom-8 right-8 bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-2xl transition"
      @click="moves.pass()"
    >
      PASS
    </button>
  </div>
</template>
