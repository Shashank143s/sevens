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
const { completeGameRecord } = useGameApi()

const players = ref<PlayerInfo[]>([])
const router = useRouter()
const { clearCredentials } = useRoomCredentials()
const { isOnline } = useOnlineStatus()

const winnerID = computed(() => state.value?.ctx?.gameover?.winner)
const isGameOver = computed(() => winnerID.value != null)
const isSocketConnected = computed(() => state.value?.isConnected !== false)
const showReconnectNotice = computed(() => !isGameOver.value && (!isOnline.value || !isSocketConnected.value))
const reconnectLabel = computed(() => {
  if (!isOnline.value) return 'You are offline. The table will sync when your network returns.'
  return 'Reconnecting to the game server...'
})
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
let completionSynced = false

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
    await syncCompletedGame()
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

async function syncCompletedGame() {
  if (completionSynced || winnerID.value == null) return
  completionSynced = true
  try {
    await completeGameRecord(props.matchId, String(winnerID.value))
  } catch (error) {
    completionSynced = false
    console.error('[game-board] Failed to finalize game record:', error)
  }
}

onUnmounted(clearRedirectTimer)

async function fetchMatchPlayers() {
  if (!props.matchId) return
  if (!isOnline.value) return
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
watch(isOnline, (online, wasOnline) => {
  if (online && wasOnline === false) {
    fetchMatchPlayers()
  }
})
</script>

<template>
  <div v-if="state" class="sevens-game-wrapper">
    <div
      v-if="showReconnectNotice"
      class="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-[9998] mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900/88 px-4 py-3 text-white shadow-2xl backdrop-blur-sm"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="text-sm font-semibold">Connection paused</div>
          <p class="text-sm text-slate-300">
            {{ reconnectLabel }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
          @click="fetchMatchPlayers"
        >
          Retry Sync
        </button>
      </div>
    </div>
    <div
      v-if="isGameOver"
      class="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 safe-area-padding"
    >
      <div class="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/96 p-6 text-white shadow-[0_30px_80px_rgba(2,6,23,0.6)] sm:p-8">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.08),transparent_32%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.05),transparent_24%)]" />
        <div class="relative text-center">
          <div class="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/20 bg-white/5 text-5xl shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
            {{ winnerDisplay.avatar }}
          </div>
          <div class="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.28em] text-amber-300/80">
            {{ didIWin ? 'Victory' : 'Round Complete' }}
          </div>
          <div class="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            {{ didIWin ? 'You won' : 'You lost' }}
          </div>
          <div class="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Winner
            <div class="mt-1 text-lg font-bold text-slate-50">
              {{ winnerDisplay.name }}
            </div>
          </div>
          <div class="mt-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
            Returning to lobby in {{ redirectSeconds }}s
          </div>
          <button
            type="button"
            class="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400 px-4 py-3 font-bold text-slate-950 shadow-[0_18px_40px_rgba(245,158,11,0.18)] transition hover:bg-amber-300"
            @click="router.push('/lobby')"
          >
            Go to Lobby
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
