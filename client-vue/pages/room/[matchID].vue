<script setup lang="ts">
import { getMatchUrl } from '~/composables/useLobbyApi'
import type { LobbyMatch } from '~/composables/useLobbyApi'
import { useRoomCredentials } from '~/composables/useRoomCredentials'

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
    class="min-h-screen min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4 sm:p-6 safe-area-padding"
  >
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
      <NuxtLink to="/lobby" class="block mt-4 text-center text-slate-500 hover:text-slate-700 text-sm">
        ← Back to Lobby
      </NuxtLink>
    </div>
  </div>

  <!-- Joined but waiting for other players -->
  <div
    v-else-if="joined && !allPlayersJoined"
    class="min-h-screen min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 safe-area-padding text-white"
  >
    <h2 class="text-xl sm:text-2xl font-bold mb-2">Waiting for players</h2>
    <p class="text-slate-400 mb-6">
      {{ joinedCount }} / {{ totalPlayers }} players have joined
    </p>
    <p class="text-slate-500 text-sm">The game will start when all players have joined.</p>
    <NuxtLink to="/lobby" class="mt-8 text-amber-400 hover:text-amber-300 text-sm">
      ← Back to Lobby
    </NuxtLink>
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
      <div class="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    </template>
  </ClientOnly>
</template>
