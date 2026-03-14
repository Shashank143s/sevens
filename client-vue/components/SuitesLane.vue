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
  <div class="suites-lane">
    <div
      v-for="rank in ranks"
      :key="`${suit}-${rank}`"
      class="suites-lane__slot"
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
        class="suites-lane__card"
        :initial="{ scale: 0.92, y: -6 }"
        :enter="{ scale: 1, y: 0 }"
      />
      <div v-else class="suites-lane__empty" />
    </div>
  </div>
</template>

<style scoped>
.suites-lane {
  display: flex;
  gap: clamp(0.25rem, 0.55vw, 0.5rem);
}

.suites-lane__slot {
  width: clamp(3.25rem, 5.65vw, 6rem);
  aspect-ratio: 500 / 726;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
}

.suites-lane__card {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 0.375rem;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.24);
  background: #fff;
  object-fit: contain;
}

.suites-lane__empty {
  width: 100%;
  height: 100%;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

@media (max-height: 900px) {
  .suites-lane {
    gap: clamp(0.22rem, 0.42vw, 0.42rem);
  }

  .suites-lane__slot {
    width: clamp(3rem, 5vw, 5.35rem);
  }
}

@media (max-height: 760px) {
  .suites-lane {
    gap: clamp(0.18rem, 0.34vw, 0.34rem);
  }

  .suites-lane__slot {
    width: clamp(2.65rem, 4.45vw, 4.75rem);
  }
}
</style>
