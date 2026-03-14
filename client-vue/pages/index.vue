<script setup lang="ts">
import cardsSymbols from '~/assets/images/cards_symbols.webp'
import backgroundLobby from '~/assets/images/background_lobby.png'

const router = useRouter()
const { setSession, session } = usePlayerSession()
const { openAuth } = useGoogleLogin()

const showJoinModal = ref(false)
const name = ref('')
const avatar = ref('🐶')

const isLoggedIn = computed(() => !!session.value?.name?.trim())

function openJoinGame() {
  name.value = session.value?.name ?? ''
  avatar.value = session.value?.avatar ?? '🐶'
  showJoinModal.value = true
}

function closeJoinModal() {
  showJoinModal.value = false
}

function joinTheTable() {
  const trimmed = name.value?.trim()
  if (!trimmed) return
  setSession(trimmed, avatar.value)
  closeJoinModal()
  router.push('/lobby')
}
</script>

<template>
  <div
    class="min-h-screen min-h-[100dvh] text-white flex items-center justify-center lg:justify-end bg-cover bg-center bg-no-repeat py-8 safe-area-padding relative"
    :style="{ backgroundImage: `url(${backgroundLobby})` }"
  >
    <!-- Login button: top right when not logged in -->
    <div class="absolute top-0 right-0 p-4 sm:p-6 safe-area-padding">
      <button
        v-if="!isLoggedIn"
        type="button"
        class="px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-600/90 border border-slate-500/50 text-white font-medium touch-manipulation"
        @click="openAuth"
      >
        Login
      </button>
    </div>

    <div class="text-center w-full max-w-md px-4 sm:px-6 lg:px-0 lg:mr-16 xl:mr-24">
      <h1
        class="title-text-clip text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-3 sm:mb-4 tracking-tighter"
        :style="{ '--cards-bg': `url(${cardsSymbols})` }"
      >
        SEVƎИƧ
      </h1>
      <p class="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-slate-400">First to empty hand wins!</p>
      <button
        v-if="isLoggedIn"
        type="button"
        class="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 w-full py-4 sm:py-5 md:py-6 text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 touch-manipulation"
        @click="openJoinGame"
      >
        Join a game
      </button>
    </div>
  </div>

  <GoogleLoginModal />

  <!-- Enter name + avatar modal -->
  <Teleport to="body">
    <div
      v-if="showJoinModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      @click.self="closeJoinModal"
    >
      <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-600">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">
            Enter Your Name
          </h2>
          <button
            type="button"
            class="text-slate-400 hover:text-white p-1"
            aria-label="Close"
            @click="closeJoinModal"
          >
            ×
          </button>
        </div>
        <input
          v-model="name"
          type="text"
          placeholder="Your display name"
          class="w-full bg-slate-700 border border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @keydown.enter="joinTheTable"
        >
        <div class="mb-2 text-sm text-slate-400">
          Avatar
        </div>
        <AvatarPicker v-model="avatar" class="mb-6" />
        <button
          type="button"
          class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl touch-manipulation"
          @click="joinTheTable"
        >
          Join the Table
        </button>
      </div>
    </div>
  </Teleport>
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
