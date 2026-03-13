<script setup lang="ts">
import type { Suit } from '@shared/types'

const props = defineProps<{
  suit: Suit
  pile: { low: number | null; high: number | null }
  ranks: number[]
  getCardImageSrc: (card: { suit: Suit; rank: number }) => string
}>()

const { suit, pile, ranks, getCardImageSrc } = toRefs(props)
</script>

<template>
  <div class="flex gap-2">
    <div
      v-for="rank in ranks"
      :key="`${suit}-${rank}`"
      class="w-24 h-34 rounded-md flex items-center justify-center"
    >
      <Motion
        v-if="
          pile.low != null &&
          pile.high != null &&
          rank >= pile.low &&
          rank <= pile.high
        "
        is="img"
        :src="getCardImageSrc({ suit, rank })"
        :alt="`${rank} of ${suit}`"
        class="w-full h-full rounded-md shadow-lg bg-white object-contain"
        :initial="{ scale: 0.92, y: -6 }"
        :enter="{ scale: 1, y: 0 }"
      />
      <div v-else class="w-full h-full rounded-md bg-white/10 shadow-inner" />
    </div>
  </div>
</template>

