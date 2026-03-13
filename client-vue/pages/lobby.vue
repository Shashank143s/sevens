<script setup lang="ts">
import { listMatches, createMatch, joinBots } from '~/composables/useLobbyApi'
import type { LobbyMatch } from '~/composables/useLobbyApi'
import { useRoomCredentials } from '~/composables/useRoomCredentials'

const router = useRouter()
const { session } = usePlayerSession()
const { getCredentials } = useRoomCredentials()

function hasJoinedRoom(matchID: string): boolean {
  return getCredentials(matchID) != null
}

const rooms = ref<LobbyMatch[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const createNumPlayers = ref(2)
const createAiBots = ref(0)
const creating = ref(false)

function joinedCount(m: LobbyMatch): number {
  return m.players?.filter(p => p.name != null && p.name !== '')?.length ?? 0
}

function totalPlayers(m: LobbyMatch): number {
  return m.players?.length ?? 0
}

function roomStatus(m: LobbyMatch): string {
  const joined = joinedCount(m)
  const total = totalPlayers(m)
  if (joined === 0) return 'Empty'
  if (joined < total) return 'Waiting for players'
  return 'Ready'
}

async function fetchRooms() {
  loading.value = true
  error.value = null
  try {
    rooms.value = await listMatches()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load rooms'
  } finally {
    loading.value = false
  }
}

function joinRoom(matchID: string) {
  router.push(`/room/${matchID}`)
}

async function openCreateModal() {
  createNumPlayers.value = 2
  createAiBots.value = 0
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function doCreateRoom() {
  creating.value = true
  try {
    const aiCount = createAiBots.value
    const { matchID } = await createMatch(createNumPlayers.value, aiCount)
    if (aiCount > 0) {
      await joinBots(matchID, aiCount)
    }
    closeCreateModal()
    router.push(`/room/${matchID}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create room'
  } finally {
    creating.value = false
  }
}

// Redirect if no session
onMounted(() => {
  if (!session.value?.name?.trim()) {
    router.replace('/')
    return
  }
  fetchRooms()
})
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] bg-slate-900 text-white p-4 sm:p-6 safe-area-padding">
    <header class="flex items-center justify-between mb-6">
      <NuxtLink to="/" class="flex items-center gap-2 text-slate-400 hover:text-white">
        ← Back
      </NuxtLink>
      <span class="text-slate-400 text-sm sm:text-base">
        Playing as <span class="text-white font-medium">{{ session?.name }}</span>
      </span>
    </header>

    <h1 class="text-2xl sm:text-3xl font-bold mb-4">Game Lobby</h1>

    <div class="flex flex-wrap gap-3 mb-4">
      <button
        type="button"
        class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium flex items-center gap-2"
        :disabled="loading"
        @click="fetchRooms"
      >
        ↻ Refresh
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold flex items-center gap-2"
        @click="openCreateModal"
      >
        + Create Room
      </button>
    </div>

    <p v-if="error" class="text-red-400 text-sm mb-4">
      {{ error }}
    </p>

    <section class="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
      <h2 class="px-4 py-3 font-semibold border-b border-slate-700">Available Rooms</h2>
      <div v-if="loading" class="p-8 text-center text-slate-400">
        Loading rooms…
      </div>
      <div v-if="!loading && rooms.length === 0" class="p-8 text-center text-slate-400">
        No rooms available. Create one to start playing!
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-slate-700 text-slate-400 text-sm">
              <th class="px-4 py-3 font-medium">Room ID</th>
              <th class="px-4 py-3 font-medium">Players</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="room in rooms"
              :key="room.matchID"
              class="border-b border-slate-700/50 hover:bg-slate-800/50"
            >
              <td class="px-4 py-3 font-mono text-sm">{{ room.matchID }}</td>
              <td class="px-4 py-3">
                {{ joinedCount(room) }} / {{ totalPlayers(room) }}
              </td>
              <td class="px-4 py-3 text-slate-400 text-sm">
                {{ roomStatus(room) }}
              </td>
              <td class="px-4 py-3">
                <button
                  v-if="!hasJoinedRoom(room.matchID)"
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                  @click="joinRoom(room.matchID)"
                >
                  Join
                </button>
                <NuxtLink
                  v-else
                  :to="`/room/${room.matchID}`"
                  class="inline-block px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-sm font-medium"
                >
                  Rejoin
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <!-- Create Room modal -->
  <Teleport to="body">
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      @click.self="closeCreateModal"
    >
      <div class="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-600">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">Create a Room</h2>
          <button
            type="button"
            class="text-slate-400 hover:text-white p-1 text-2xl leading-none"
            aria-label="Close"
            @click="closeCreateModal"
          >
            ×
          </button>
        </div>

        <label class="block text-sm text-slate-400 mb-1">Number of Players</label>
        <select
          v-model.number="createNumPlayers"
          class="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option :value="2">2 Players</option>
          <option :value="3">3 Players</option>
          <option :value="4">4 Players</option>
        </select>

        <label class="block text-sm text-slate-400 mb-1">AI Opponents</label>
        <select
          v-model.number="createAiBots"
          class="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option :value="0">None</option>
          <option :value="1">1 Bot</option>
          <option :value="2">2 Bots</option>
        </select>

        <button
          type="button"
          class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50"
          :disabled="creating"
          @click="doCreateRoom"
        >
          + Create Room
        </button>
      </div>
    </div>
  </Teleport>
</template>
