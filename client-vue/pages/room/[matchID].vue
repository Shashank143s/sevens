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
  <div v-if="!joined" class="min-h-screen bg-slate-900 flex items-center justify-center">
    <div class="bg-white p-10 rounded-3xl shadow-2xl text-slate-900 max-w-sm w-full">
      <h2 class="text-3xl mb-6">
        Join Room {{ matchID }}
      </h2>
      <input
        v-model="playerName"
        type="text"
        placeholder="Your alias"
        class="w-full border-2 border-slate-300 p-4 rounded-2xl mb-6"
      >
      <AvatarPicker :model-value="avatar" @update:model-value="avatar = $event" />
      <div class="mt-4 text-lg">
        Selected avatar: <span class="text-3xl">{{ avatar }}</span>
      </div>
      <button
        type="button"
        class="mt-8 bg-emerald-500 text-white w-full py-6 rounded-3xl text-xl font-bold"
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
