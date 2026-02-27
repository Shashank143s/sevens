<script setup lang="ts">
import cardsSymbols from '~/assets/images/cards_symbols.webp'
import backgroundLobby from '~/assets/images/background_lobby.png'

const roomCode = ref('')
const router = useRouter()

const createRoom = () => {
  router.push('/room/' + Math.random().toString(36).substring(2, 10))
}

const joinRoom = () => {
  if (roomCode.value) {
    router.push(`/room/${roomCode.value}`)
  }
}
</script>

<template>
  <div
    class="min-h-screen text-white flex items-center justify-end bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundLobby})` }"
  >
    <div class="text-center max-w-md mr-16 lg:mr-24">
      <h1
        class="title-text-clip text-8xl font-black mb-4 tracking-tighter"
        :style="{ '--cards-bg': `url(${cardsSymbols})` }"
      >
        SEVƎИƧ
      </h1>
      <p class="text-xl mb-12 text-slate-400">First to empty hand wins!</p>
      <button
        type="button"
        class="bg-emerald-500 hover:bg-emerald-600 w-full py-6 text-3xl font-bold rounded-3xl mb-8"
        @click="createRoom"
      >
        Create New Room
      </button>
      <div class="flex gap-3">
        <input
          :value="roomCode"
          type="text"
          placeholder="Room code"
          class="bg-slate-800 px-6 py-4 rounded-3xl flex-1 text-xl"
          @input="roomCode = ($event.target as HTMLInputElement).value.toUpperCase()"
        >
        <button
          type="button"
          class="bg-white text-slate-900 px-10 py-4 rounded-3xl font-bold"
          @click="joinRoom"
        >
          Join
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-text-clip {
  background-image: var(--cards-bg);
  background-size: contain;
  background-position: center;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
</style>
