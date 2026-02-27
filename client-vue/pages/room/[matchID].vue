<script setup lang="ts">
const route = useRoute()
const matchID = computed(() => route.params.matchID as string)

const joined = ref(false)
const playerName = ref('')
const avatar = ref('🐶')

const enterGame = () => {
  joined.value = true
}
</script>

<template>
  <div v-if="!joined" class="min-h-screen min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4 sm:p-6 safe-area-padding">
    <div class="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-900 max-w-sm w-full">
      <h2 class="text-2xl sm:text-3xl mb-4 sm:mb-6">
        Join Room {{ matchID }}
      </h2>
      <input
        v-model="playerName"
        type="text"
        placeholder="Your alias"
        class="w-full border-2 border-slate-300 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 text-base"
      >
      <AvatarPicker :model-value="avatar" @update:model-value="avatar = $event" />
      <div class="mt-4 text-base sm:text-lg">
        Selected avatar: <span class="text-2xl sm:text-3xl">{{ avatar }}</span>
      </div>
      <button
        type="button"
        class="mt-6 sm:mt-8 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white w-full py-4 sm:py-6 rounded-2xl sm:rounded-3xl text-lg sm:text-xl font-bold touch-manipulation"
        @click="enterGame"
      >
        ENTER GAME
      </button>
    </div>
  </div>

  <ClientOnly v-else>
    <SevensGameBoard v-if="matchID" :match-id="matchID" />
    <template #fallback>
      <div class="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    </template>
  </ClientOnly>
</template>
