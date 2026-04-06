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
const { session } = usePlayerSession()
const { getAccount } = useAccountApi()
const { completeGameRecord, getGameRecord } = useGameApi()

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
const humanPlayerIds = computed(() => {
  return players.value
    .filter((player) => player.name && !player.name.startsWith('Bot '))
    .map((player) => player.id)
    .sort((left, right) => left - right)
})
const shouldFinalizeGame = computed(() => {
  if (state.value?.playerID == null) return false
  const currentPlayerId = Number(state.value.playerID)
  return humanPlayerIds.value[0] === currentPlayerId
})
const didIWin = computed(() => {
  const id = winnerID.value
  if (id == null) return false
  return state.value?.playerID != null && Number(state.value.playerID) === id
})

const redirectSeconds = ref(30)
const winnerCoinsDelta = ref<number | null>(null)
const winnerTotalCoins = ref<number | null>(null)
const gameFinishedLocally = ref(false)
const redirectDeadline = ref<number | null>(null)
let redirectTimer: ReturnType<typeof setInterval> | null = null
let deleteRequested = false
let completionSynced = false

function clearRedirectTimer() {
  if (redirectTimer != null) {
    clearInterval(redirectTimer)
    redirectTimer = null
  }
}

async function syncRedirectState() {
  if (!redirectDeadline.value) return

  const remainingMs = redirectDeadline.value - Date.now()
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  redirectSeconds.value = remainingSeconds

  if (remainingMs <= 0) {
    clearRedirectTimer()
    await router.replace('/lobby')
  }
}

function handleVisibilityResume() {
  if (!gameFinishedLocally.value) return
  void syncRedirectState()
}

watch(
  isGameOver,
  async (over) => {
    clearRedirectTimer()
    if (!over) {
      gameFinishedLocally.value = false
      redirectDeadline.value = null
      return
    }
    gameFinishedLocally.value = true
    winnerCoinsDelta.value = null
    winnerTotalCoins.value = null
    redirectDeadline.value = Date.now() + 30_000
    redirectSeconds.value = 30
    // Clear stored creds so user can re-join next game cleanly.
    clearCredentials(props.matchId)
    await syncCompletedGame()
    await loadWinnerEconomy()
    // Best-effort: delete the room from the lobby once the game ends.
    if (!deleteRequested) {
      deleteRequested = true
      fetch(`${useRuntimeConfig().public.apiBase}/api/match/delete/${props.matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {})
    }
    redirectTimer = setInterval(() => {
      void syncRedirectState()
    }, 1000)
    await syncRedirectState()
  },
  { immediate: true },
)

async function loadWinnerEconomy() {
  if (!didIWin.value || !session.value?.id) return

  const accountIdentifier = session.value.id || session.value.email?.trim()
  if (!accountIdentifier) return

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const [accountResponse, gameResponse] = await Promise.all([
        getAccount(accountIdentifier, 0, 0),
        getGameRecord(props.matchId),
      ])

      winnerTotalCoins.value = accountResponse.user.wallet?.coins_balance ?? null
      const player = gameResponse.game.players?.find((entry) => entry.user_id === session.value?.id)
      winnerCoinsDelta.value = player?.coins?.delta ?? null

      if (winnerTotalCoins.value != null && winnerCoinsDelta.value != null) {
        return
      }
    } catch (error) {
      console.error('[game-board] Failed to load winner economy:', error)
    }

    await new Promise(resolve => setTimeout(resolve, 400))
  }
}

async function syncCompletedGame() {
  if (completionSynced || winnerID.value == null || !shouldFinalizeGame.value) return
  completionSynced = true
  try {
    await completeGameRecord(props.matchId, String(winnerID.value))
  } catch (error) {
    completionSynced = false
    console.error('[game-board] Failed to finalize game record:', error)
  }
}

onUnmounted(clearRedirectTimer)
onMounted(() => {
  if (!import.meta.client) return
  document.addEventListener('visibilitychange', handleVisibilityResume)
  window.addEventListener('pageshow', handleVisibilityResume)
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.removeEventListener('visibilitychange', handleVisibilityResume)
  window.removeEventListener('pageshow', handleVisibilityResume)
})

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
    <WinnerOverlay
      v-if="isGameOver"
      :avatar="winnerDisplay.avatar"
      :winner-name="winnerDisplay.name"
      :did-i-win="didIWin"
      :redirect-seconds="redirectSeconds"
      :won-coins="winnerCoinsDelta"
      :total-coins="winnerTotalCoins"
      @go-lobby="router.push('/lobby')"
    />
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
