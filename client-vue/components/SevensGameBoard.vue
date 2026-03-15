<script setup lang="ts">
import { useSevensClient } from '~/composables/useSevensClient'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import backgroundGame from '~/assets/images/poker_cards_table.png'

export interface PlayerInfo {
  id: number
  name?: string | null
  avatar?: string
}

const props = defineProps<{
  matchId: string
  playerId: string | null
  credentials?: string | null
}>()

const { state } = useSevensClient(
  props.matchId,
  props.playerId ?? '0',
  props.credentials ?? undefined,
)

const players = ref<PlayerInfo[]>([])
const router = useRouter()
const { clearCredentials } = useRoomCredentials()

const winnerID = computed(() => state.value?.ctx?.gameover?.winner)
const isGameOver = computed(() => winnerID.value != null)
const winnerDisplay = computed(() => {
  const id = winnerID.value
  if (id == null) return { name: 'Unknown', avatar: '🏆' }
  const p = players.value.find((x) => x.id === id) ?? players.value[id]
  return {
    name: p?.name ?? `Player ${id}`,
    avatar: p?.avatar ?? '🏆',
  }
})
const didIWin = computed(() => {
  const id = winnerID.value
  if (id == null) return false
  return state.value?.playerID != null && Number(state.value.playerID) === id
})

const redirectSeconds = ref(30)
let redirectTimer: ReturnType<typeof setInterval> | null = null
let deleteRequested = false

function clearRedirectTimer() {
  if (redirectTimer != null) {
    clearInterval(redirectTimer)
    redirectTimer = null
  }
}

watch(
  isGameOver,
  async (over) => {
    clearRedirectTimer()
    if (!over) return
    redirectSeconds.value = 30
    // Clear stored creds so user can re-join next game cleanly.
    clearCredentials(props.matchId)
    // Best-effort: delete the room from the lobby once the game ends.
    if (!deleteRequested) {
      deleteRequested = true
      fetch(`${useRuntimeConfig().public.apiBase}/api/match/delete/${props.matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {})
    }
    redirectTimer = setInterval(async () => {
      redirectSeconds.value -= 1
      if (redirectSeconds.value <= 0) {
        clearRedirectTimer()
        await router.push('/lobby')
      }
    }, 1000)
  },
  { immediate: true },
)

onUnmounted(clearRedirectTimer)

async function fetchMatchPlayers() {
  if (!props.matchId) return
  try {
    const res = await fetch(`${useRuntimeConfig().public.apiBase}/games/sevens/${props.matchId}`)
    if (!res.ok) return
    const data = await res.json() as {
      players?: Array<{ id?: number; name?: string | null; data?: { avatar?: string } }>
    }
    if (Array.isArray(data.players)) {
      players.value = data.players.map((p, i) => ({
        id: p.id ?? i,
        name: p.name ?? null,
        avatar: p.data?.avatar,
      }))
    }
  } catch {
    // ignore
  }
}

watch(() => props.matchId, fetchMatchPlayers, { immediate: true })
// Refresh players when game state appears (e.g. after join)
watch(() => state.value?.G, fetchMatchPlayers)
</script>

<template>
  <div v-if="state" class="sevens-game-wrapper">
    <div
      v-if="isGameOver"
      class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 safe-area-padding"
    >
      <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900">
        <div class="text-center">
          <div class="text-5xl mb-3">{{ winnerDisplay.avatar }}</div>
          <div class="text-2xl sm:text-3xl font-extrabold mb-2">
            {{ didIWin ? 'You won!' : 'You lost' }}
          </div>
          <div class="text-slate-600 mb-6">
            Winner: <span class="font-bold">{{ winnerDisplay.name }}</span>
          </div>
          <div class="text-slate-500 text-sm">
            Returning to lobby in <span class="font-bold">{{ redirectSeconds }}s</span>
          </div>
          <button
            type="button"
            class="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-bold"
            @click="router.push('/lobby')"
          >
            Go to lobby now
          </button>
        </div>
      </div>
    </div>
    <GameBoard
      :G="state.G"
      :ctx="state.ctx"
      :moves="state.moves"
      :player-id="state.playerID"
      :players="players"
    />
  </div>
  <div
    v-else
    class="min-h-screen min-h-[100dvh] bg-slate-900 bg-cover bg-center bg-no-repeat flex items-center justify-center text-white safe-area-padding p-4 sm:p-6"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <div class="w-full max-w-sm rounded-2xl border border-slate-600 bg-slate-800/92 backdrop-blur-sm shadow-2xl p-6 text-center">
      <div class="text-xs uppercase tracking-[0.28em] text-amber-300/80 mb-3">Sevens Royale</div>
      <div class="text-2xl sm:text-3xl font-bold text-white mb-2">Connecting to table</div>
      <p class="text-sm sm:text-base text-slate-400">Syncing your seat and loading the room...</p>
    </div>
  </div>
</template>
