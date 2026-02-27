<script setup lang="ts">
import { useSevensClient } from '~/composables/useSevensClient'

const props = defineProps<{
  matchId: string
}>()

const { state } = useSevensClient(props.matchId, '0')
</script>

<template>
  <div v-if="state" class="sevens-game-wrapper">
    <GameBoard
      :G="state.G"
      :ctx="state.ctx"
      :moves="state.moves"
      :player-i-d="state.playerID"
    />
  </div>
  <div v-else class="min-h-screen min-h-[100dvh] bg-slate-900 flex items-center justify-center text-white text-lg sm:text-2xl safe-area-padding">
    Connecting...
  </div>
</template>
