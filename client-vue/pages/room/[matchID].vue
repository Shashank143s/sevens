<script setup lang="ts">
import { getMatchUrl } from '~/composables/useLobbyApi'
import type { LobbyMatch } from '~/composables/useLobbyApi'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import backgroundGame from '~/assets/images/poker_cards_table.png'

const route = useRoute()
const matchID = computed(() => route.params.matchID as string)
const { session } = usePlayerSession()
const { getCredentials, setCredentials } = useRoomCredentials()
const { registerJoinedPlayer, markGameInProgress } = useGameApi()
const { isOnline } = useOnlineStatus()

const joined = ref(false)
const rejoining = ref(false)
const playerName = ref('')
const avatar = ref('🐶')
const playerID = ref<string | null>(null)
const playerCredentials = ref<string | null>(null)
const joining = ref(false)
const joinError = ref<string | null>(null)
const roomStatusMessage = ref<string | null>(null)
const checkingRoom = ref(false)
const gameStarted = ref(false)

// After join: wait until all players have joined before showing game
const matchMeta = ref<LobbyMatch | null>(null)
const allPlayersJoined = computed(() => {
  if (!matchMeta.value?.players?.length) return false
  const total = matchMeta.value.players.length
  const filled = matchMeta.value.players.filter(p => p.name != null && p.name !== '').length
  return filled === total
})

async function fetchMatchMeta() {
  if (!isOnline.value) {
    roomStatusMessage.value = 'You are offline. Reconnect to resume this table.'
    return false
  }

  try {
    checkingRoom.value = true
    const res = await fetch(getMatchUrl(matchID.value))
    if (!res.ok) {
      roomStatusMessage.value = 'Unable to load the room right now.'
      return false
    }
    matchMeta.value = await res.json() as LobbyMatch
    roomStatusMessage.value = null
    return true
  } catch {
    roomStatusMessage.value = 'Connection lost while loading room details.'
    return false
  } finally {
    checkingRoom.value = false
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    const ok = await fetchMatchMeta()
    if (!ok) return
    if (allPlayersJoined.value && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }, 2000)
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// Pre-fill from session; restore already-joined state so user cannot join the same game again
onMounted(async () => {
  if (session.value) {
    playerName.value = session.value.name
    avatar.value = session.value.avatar
  }
  const stored = getCredentials(matchID.value)
  if (stored) {
    rejoining.value = true
    playerID.value = stored.playerID
    playerCredentials.value = stored.credentials
    joined.value = true
    await fetchMatchMeta()
    startPolling()
    return
  }

  await fetchMatchMeta()
})

const enterGame = async () => {
  if (!playerName.value.trim()) return
  if (!isOnline.value) {
    joinError.value = 'Reconnect before joining this table.'
    return
  }

  try {
    joining.value = true
    joinError.value = null
    const metaRes = await fetch(getMatchUrl(matchID.value))
    if (!metaRes.ok) {
      joinError.value = 'Could not load the room. Please try again.'
      return
    }

    const meta = await metaRes.json() as { players: { id: number; name?: string | null }[] }
    const freeSlot = meta.players.find(p => !p.name)

    if (!freeSlot) {
      joinError.value = 'This room is full.'
      return
    }

    const joinRes = await fetch(`${getMatchUrl(matchID.value)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerID: String(freeSlot.id),
        playerName: playerName.value.trim(),
        data: { avatar: avatar.value },
      }),
    })

    if (!joinRes.ok) {
      joinError.value = 'Unable to join the room right now.'
      return
    }

    const joinData = await joinRes.json() as { playerID: string; playerCredentials: string }
    playerID.value = joinData.playerID
    playerCredentials.value = joinData.playerCredentials
    joined.value = true
    await syncJoinedPlayer(joinData.playerID)
    setCredentials(matchID.value, {
      playerID: joinData.playerID,
      credentials: joinData.playerCredentials,
    })
    await fetchMatchMeta()
    startPolling()
  } catch {
    joinError.value = 'Connection lost while joining. Try again when the network is back.'
  } finally {
    joining.value = false
  }
}

async function syncJoinedPlayer(joinedPlayerID: string) {
  await registerJoinedPlayer(matchID.value, {
    joined_player: {
      user_id: session.value?.id,
      player_id: joinedPlayerID,
      display_name: playerName.value.trim(),
      is_bot: false,
      joined_at: new Date().toISOString(),
    },
  })
}

async function retryRoomFetch() {
  await fetchMatchMeta()
}

async function syncGameStart() {
  if (gameStarted.value || !joined.value || !allPlayersJoined.value) return

  gameStarted.value = true
  try {
    await markGameInProgress(matchID.value)
  } catch (error) {
    gameStarted.value = false
    console.error('[room] Failed to mark game in progress:', error)
  }
}

watch(isOnline, async (online, wasOnline) => {
  if (!online) {
    if (joined.value) {
      roomStatusMessage.value = 'You are offline. We will reconnect when your network returns.'
    }
    return
  }

  if (wasOnline === false) {
    roomStatusMessage.value = joined.value ? 'Connection restored. Syncing your table...' : null
    await fetchMatchMeta()
    if (joined.value) startPolling()
  }
})

watch(allPlayersJoined, async (ready) => {
  if (!ready) return
  await syncGameStart()
})

const joinedCount = computed(() => {
  if (!matchMeta.value?.players) return 0
  return matchMeta.value.players.filter(p => p.name != null && p.name !== '').length
})
const totalPlayers = computed(() => matchMeta.value?.players?.length ?? 0)
const roomBannerTone = computed(() => (isOnline.value ? 'border-white/10 bg-slate-900/70 text-slate-200' : 'border-red-400/20 bg-red-950/40 text-red-100'))
</script>

<template>
  <!-- Not yet joined: show join form (pre-filled from session) -->
  <div
    v-if="!joined"
    class="min-h-screen min-h-[100dvh] bg-slate-900 bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 sm:p-6 safe-area-padding"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <div class="w-full max-w-md">
      <div
        v-if="roomStatusMessage"
        class="mb-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm"
        :class="roomBannerTone"
      >
        <div class="flex items-center justify-between gap-3">
          <span>{{ roomStatusMessage }}</span>
          <button
            v-if="isOnline && !checkingRoom"
            type="button"
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white"
            @click="retryRoomFetch"
          >
            Retry
          </button>
        </div>
      </div>
      <p v-if="joinError" class="mb-4 rounded-2xl border border-red-400/20 bg-red-950/40 px-4 py-3 text-sm text-red-100 backdrop-blur-sm">
        {{ joinError }}
      </p>
      <JoinTableModal
        :match-id="matchID"
        :player-name="playerName"
        :avatar="avatar"
        @update:player-name="playerName = $event"
        @update:avatar="avatar = $event"
        @submit="enterGame"
      />
      <p class="mt-3 text-center text-sm text-slate-400">
        <span v-if="joining">Joining table...</span>
        <span v-else-if="checkingRoom">Checking room status...</span>
        <span v-else-if="!isOnline">Offline mode prevents joining until you reconnect.</span>
      </p>
    </div>
  </div>

  <!-- Joined but waiting for other players -->
  <div
    v-else-if="joined && !rejoining && !allPlayersJoined"
    class="min-h-screen min-h-[100dvh] bg-slate-900 bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 sm:p-6 safe-area-padding text-white"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <Motion preset="slideTop">
      <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-600 text-center">
        <h2 class="text-xl font-bold text-white mb-2">Waiting for players</h2>
        <p
          v-if="roomStatusMessage"
          class="mb-4 rounded-xl border px-3 py-2 text-sm"
          :class="roomBannerTone"
        >
          {{ roomStatusMessage }}
        </p>
        <p class="text-slate-400 mb-4">
          {{ joinedCount }} / {{ totalPlayers }} players have joined
        </p>
        <p class="text-sm text-slate-500 mb-6">The game will start when all players have joined.</p>
        <button
          v-if="isOnline"
          type="button"
          class="mb-3 inline-flex items-center justify-center w-full border border-white/10 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl touch-manipulation"
          @click="retryRoomFetch"
        >
          Check Again
        </button>
        <NuxtLink
          to="/lobby"
          class="inline-flex items-center justify-center w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl touch-manipulation"
        >
          Back to Lobby
        </NuxtLink>
      </div>
    </Motion>
  </div>

  <!-- All players joined: show game -->
  <ClientOnly v-else>
    <SevensGameBoard
      v-if="matchID && playerID && playerCredentials"
      :match-id="matchID"
      :player-id="playerID"
      :credentials="playerCredentials"
    />
    <template #fallback>
      <div
        class="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat flex items-center justify-center text-white p-4 sm:p-6 safe-area-padding"
        :style="{ backgroundImage: `url(${backgroundGame})` }"
      >
        <Motion preset="slideTop">
          <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-600 text-center">
            <h2 class="text-xl font-bold text-white mb-2">Preparing the table</h2>
            <p class="text-slate-400 text-sm">Loading the game board...</p>
          </div>
        </Motion>
      </div>
    </template>
  </ClientOnly>
</template>
