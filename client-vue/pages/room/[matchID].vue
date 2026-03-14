<script setup lang="ts">
import { getMatchUrl } from '~/composables/useLobbyApi'
import type { LobbyMatch } from '~/composables/useLobbyApi'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import backgroundGame from '~/assets/images/poker_cards_table.png'

const route = useRoute()
const matchID = computed(() => route.params.matchID as string)
const { session } = usePlayerSession()
const { getCredentials, setCredentials } = useRoomCredentials()

const joined = ref(false)
const playerName = ref('')
const avatar = ref('🐶')
const playerID = ref<string | null>(null)
const playerCredentials = ref<string | null>(null)

// After join: wait until all players have joined before showing game
const matchMeta = ref<LobbyMatch | null>(null)
const allPlayersJoined = computed(() => {
  if (!matchMeta.value?.players?.length) return false
  const total = matchMeta.value.players.length
  const filled = matchMeta.value.players.filter(p => p.name != null && p.name !== '').length
  return filled === total
})

async function fetchMatchMeta() {
  try {
    const res = await fetch(getMatchUrl(matchID.value))
    if (!res.ok) return
    matchMeta.value = await res.json() as LobbyMatch
  } catch {}
}

let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    await fetchMatchMeta()
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
    playerID.value = stored.playerID
    playerCredentials.value = stored.credentials
    joined.value = true
    await fetchMatchMeta()
    startPolling()
  }
})

const enterGame = async () => {
  if (!playerName.value.trim()) return

  try {
    const metaRes = await fetch(getMatchUrl(matchID.value))
    if (!metaRes.ok) {
      console.error('Failed to fetch room metadata', await metaRes.text())
      return
    }

    const meta = await metaRes.json() as { players: { id: number; name?: string | null }[] }
    const freeSlot = meta.players.find(p => !p.name)

    if (!freeSlot) {
      console.error('Room is full')
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
      console.error('Failed to join room', await joinRes.text())
      return
    }

    const joinData = await joinRes.json() as { playerID: string; playerCredentials: string }
    playerID.value = joinData.playerID
    playerCredentials.value = joinData.playerCredentials
    joined.value = true
    setCredentials(matchID.value, {
      playerID: joinData.playerID,
      credentials: joinData.playerCredentials,
    })
    await fetchMatchMeta()
    startPolling()
  } catch (err) {
    console.error('Error joining room', err)
  }
}

const joinedCount = computed(() => {
  if (!matchMeta.value?.players) return 0
  return matchMeta.value.players.filter(p => p.name != null && p.name !== '').length
})
const totalPlayers = computed(() => matchMeta.value?.players?.length ?? 0)
</script>

<template>
  <!-- Not yet joined: show join form (pre-filled from session) -->
  <div
    v-if="!joined"
    class="min-h-screen min-h-[100dvh] bg-slate-900 bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 sm:p-6 safe-area-padding"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <Motion preset="slideTop">
      <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-600 text-white">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">
            Join Room {{ matchID }}
          </h2>
          <NuxtLink
            to="/lobby"
            class="text-slate-400 hover:text-white p-1 text-2xl leading-none"
            aria-label="Back to Lobby"
          >
            ×
          </NuxtLink>
        </div>
        <input
          v-model="playerName"
          type="text"
          placeholder="Your alias"
          class="w-full bg-slate-700 border border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @keydown.enter="enterGame"
        >
        <div class="mb-2 text-sm text-slate-400">
          Avatar
        </div>
        <AvatarPicker :model-value="avatar" class="mb-4" @update:model-value="avatar = $event" />
        <div class="text-sm text-slate-400 mb-6">
          Selected avatar: <span class="text-2xl align-middle ml-2">{{ avatar }}</span>
        </div>
        <button
          type="button"
          class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl touch-manipulation"
          @click="enterGame"
        >
          Join the Table
        </button>
        <NuxtLink to="/lobby" class="block mt-4 text-center text-slate-400 hover:text-white text-sm">
          ← Back to Lobby
        </NuxtLink>
      </div>
    </Motion>
  </div>

  <!-- Joined but waiting for other players -->
  <div
    v-else-if="joined && !allPlayersJoined"
    class="min-h-screen min-h-[100dvh] bg-slate-900 bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 sm:p-6 safe-area-padding text-white"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <Motion preset="slideTop">
      <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-600 text-center">
        <h2 class="text-xl font-bold text-white mb-2">Waiting for players</h2>
        <p class="text-slate-400 mb-4">
          {{ joinedCount }} / {{ totalPlayers }} players have joined
        </p>
        <p class="text-sm text-slate-500 mb-6">The game will start when all players have joined.</p>
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
