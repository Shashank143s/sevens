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
    class="min-h-screen min-h-[100dvh] text-white flex items-center justify-center lg:justify-end bg-cover bg-center bg-no-repeat py-8 safe-area-padding"
    :style="{ backgroundImage: `url(${backgroundLobby})` }"
  >
    <div class="text-center w-full max-w-md px-4 sm:px-6 lg:px-0 lg:mr-16 xl:mr-24">
      <h1
        class="title-text-clip text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-3 sm:mb-4 tracking-tighter"
        :style="{ '--cards-bg': `url(${cardsSymbols})` }"
      >
        SEVƎИƧ
      </h1>
      <p class="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-slate-400">First to empty hand wins!</p>
      <button
        type="button"
        class="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 w-full py-4 sm:py-5 md:py-6 text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 touch-manipulation"
        @click="createRoom"
      >
        Create New Room
      </button>
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          :value="roomCode"
          type="text"
          placeholder="Room code"
          class="bg-slate-800 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl flex-1 text-lg sm:text-xl min-w-0"
          @input="roomCode = ($event.target as HTMLInputElement).value.toUpperCase()"
        >
        <button
          type="button"
          class="bg-white text-slate-900 px-8 sm:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-bold touch-manipulation shrink-0"
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
