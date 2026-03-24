<script setup lang="ts">
import { listMatches, createMatch, joinBots } from '~/composables/useLobbyApi'
import type { LobbyMatch } from '~/composables/useLobbyApi'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import backgroundGame from '~/assets/images/poker_cards_table.png'

const router = useRouter()
const { session } = usePlayerSession()
const { getCredentials } = useRoomCredentials()
const { createGameRecord } = useGameApi()
const { getAccount } = useAccountApi()
const { isOnline } = useOnlineStatus()
const {
  isSupported: notificationsSupported,
  isGranted: notificationsGranted,
  canRequest: canRequestNotifications,
  statusLabel: notificationsStatusLabel,
  requestPermission,
} = useNotifications()

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
const reconnecting = ref(false)
const remainingRooms = ref<number | null>(null)
const dailyRoomLimit = ref<number | null>(null)
const createPrivateRoom = ref(false)
const createRoomPassword = ref('')
const createRoomPasswordConfirm = ref('')
const createRoomName = ref('')
const roomNameTouched = ref(false)

const createRoomDisabled = computed(() => !isOnline.value || remainingRooms.value === 0)
const remainingRoomsLabel = computed(() => {
  if (remainingRooms.value == null || dailyRoomLimit.value == null) return null
  return `Games today: ${dailyRoomLimit.value - remainingRooms.value} / ${dailyRoomLimit.value}`
})
const remainingRoomsToneClass = computed(() => {
  if (remainingRooms.value == null || dailyRoomLimit.value == null) return ''
  const usedRooms = dailyRoomLimit.value - remainingRooms.value
  if (usedRooms < 5) {
    return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100 shadow-[0_10px_25px_rgba(16,185,129,0.12)]'
  }
  if (usedRooms <= 8) {
    return 'border-amber-300/25 bg-amber-500/10 text-amber-100 shadow-[0_10px_25px_rgba(245,158,11,0.12)]'
  }
  return 'border-red-500 bg-red-500/12 text-red-50 shadow-[0_10px_25px_rgba(239,68,68,0.18)]'
})

const lobbyStatus = computed(() => {
  if (!isOnline.value) return 'You are offline. Reconnect to refresh rooms or create a new table.'
  if (error.value) return error.value
  if (reconnecting.value) return 'Connection restored. Refreshing available rooms...'
  return null
})

function joinedCount(m: LobbyMatch): number {
  return m.joined_count ?? m.players?.filter(p => p.name != null && p.name !== '')?.length ?? 0
}

function totalPlayers(m: LobbyMatch): number {
  return m.room_size ?? m.players?.length ?? 0
}

function isRoomFull(m: LobbyMatch): boolean {
  return joinedCount(m) >= totalPlayers(m)
}

function roomStatus(m: LobbyMatch): string {
  const joined = joinedCount(m)
  const total = totalPlayers(m)
  if (joined < total) return '🟢'
  return '🔴'
}

function roomStatusDotClass(m: LobbyMatch): string {
  return isRoomFull(m) ? 'bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.5)]' : 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]'
}

function displayRoomID(matchID: string): string {
  return matchID
}

async function fetchRooms() {
  if (!isOnline.value) {
    loading.value = false
    error.value = 'You are offline. Rooms will refresh when your connection returns.'
    return
  }

  loading.value = true
  error.value = null
  try {
    await refreshRemainingRooms().catch(() => {})
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
  if (createRoomDisabled.value) return
  error.value = null
  createNumPlayers.value = 2
  createAiBots.value = 0
  createRoomName.value = ''
  roomNameTouched.value = false
  createPrivateRoom.value = false
  createRoomPassword.value = ''
  createRoomPasswordConfirm.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function doCreateRoom() {
  if (!isOnline.value) {
    error.value = 'Reconnect before creating a room.'
    return
  }
  if (remainingRooms.value === 0) {
    error.value = 'You have reached today’s room creation limit. You can still join existing rooms.'
    return
  }
  if (!validateRoomName()) return
  if (createPrivateRoom.value && !validatePrivateRoomPassword()) return

  creating.value = true
  try {
    const aiCount = createAiBots.value
    const { matchID } = await createMatch(createNumPlayers.value, aiCount)
    await createGameRecordEntry(matchID)
    if (aiCount > 0) {
      await joinBots(matchID, aiCount)
    }
    closeCreateModal()
    router.push(`/room/${matchID}`)
  } catch (e) {
    await refreshRemainingRooms()
    error.value = e instanceof Error ? e.message : 'Failed to create room'
  } finally {
    creating.value = false
  }
}

async function createGameRecordEntry(matchID: string) {
  try {
    await createGameRecord(matchID, {
      room_name: createRoomName.value.trim(),
      room_size: createNumPlayers.value,
      creator_user_id: session.value?.id,
      access: {
        is_private: createPrivateRoom.value,
        password: createRoomPassword.value,
      },
      metadata: {
        source: 'web',
      },
    })
  } catch (error) {
    await deleteCreatedRoom(matchID)
    throw error
  }
}

async function deleteCreatedRoom(matchID: string) {
  await fetch(`${useRuntimeConfig().public.apiBase}/api/match/delete/${matchID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {})
}

async function refreshRemainingRooms() {
  const identifier = session.value?.id || session.value?.email?.trim()
  if (!identifier) return
  const response = await getAccount(identifier, 0, 0)
  dailyRoomLimit.value = response.user.daily_room_limit
  remainingRooms.value = response.user.remaining_rooms
}

function validatePrivateRoomPassword() {
  const password = createRoomPassword.value.trim()
  if (password.length < 4) {
    error.value = 'Private room passwords must be at least 4 characters.'
    return false
  }
  if (password !== createRoomPasswordConfirm.value.trim()) {
    error.value = 'Private room passwords do not match.'
    return false
  }
  return true
}

function validateRoomName() {
  roomNameTouched.value = true
  const roomName = createRoomName.value.trim()
  if (roomName.length < 3) {
    error.value = 'Room name must be at least 3 characters.'
    return false
  }
  if (roomName.length > 40) {
    error.value = 'Room name must be 40 characters or fewer.'
    return false
  }
  return true
}

async function enableNotifications() {
  await requestPermission()
}

watch(isOnline, async (online, wasOnline) => {
  if (!online) return
  if (wasOnline === false) {
    reconnecting.value = true
    await fetchRooms()
    reconnecting.value = false
  }
})

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
  <div
    class="min-h-screen min-h-[100dvh] bg-slate-900 text-white p-4 sm:p-6 safe-area-padding bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <header class="flex items-center justify-between mb-6">
      <NuxtLink to="/" class="flex items-center gap-2 text-slate-400 hover:text-white">
        ← Back
      </NuxtLink>
      <AppUserMenu />
    </header>

    <div class="mx-auto w-full max-w-5xl">
      <div class="mb-4 flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-50">Game Lobby</h1>
          <div
            v-if="remainingRoomsLabel"
            class="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold"
            :class="remainingRoomsToneClass"
          >
            {{ remainingRoomsLabel }}
          </div>
        </div>
      </div>

      <div
        v-if="lobbyStatus"
        class="mb-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm"
        :class="isOnline ? 'border-amber-400/20 bg-slate-900/70 text-slate-200' : 'border-red-400/20 bg-red-950/40 text-red-100'"
      >
        {{ lobbyStatus }}
      </div>

      <section
        v-if="false"
        class="mb-4 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-sm p-4"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-sm font-semibold text-slate-100">Turn Alerts</h2>
            <p class="text-sm text-slate-400">
              {{ notificationsStatusLabel }}
            </p>
          </div>
          <button
            v-if="canRequestNotifications"
            type="button"
            class="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-400"
            @click="enableNotifications"
          >
            Enable Alerts
          </button>
          <span
            v-else-if="notificationsGranted"
            class="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200"
          >
            Enabled
          </span>
        </div>
      </section>

      <section class="flex max-h-[calc(100dvh-18rem)] flex-col rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
        <div class="shrink-0 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 class="font-semibold text-slate-100">Available Rooms</h2>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-slate-900/70 text-slate-100 backdrop-blur-sm transition hover:bg-slate-800/85 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading || !isOnline"
              aria-label="Refresh rooms"
              title="Refresh rooms"
              @click="fetchRooms"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15.55-6.36L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15.55 6.36L3 16" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-300/20 bg-amber-400 text-slate-950 shadow-[0_14px_30px_rgba(245,158,11,0.18)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="createRoomDisabled"
              aria-label="Create room"
              title="Create room"
              @click="openCreateModal"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
        <div v-if="loading" class="flex flex-1 items-center justify-center px-4 py-10 text-center text-slate-400">
          Loading rooms…
        </div>
        <div v-else-if="rooms.length === 0" class="flex flex-1 items-center justify-center px-4 py-10 text-center text-slate-400">
          No rooms available. Create one to start playing!
        </div>
        <div v-else class="flex-1 overflow-y-auto p-3 sm:p-4">
          <div class="space-y-3">
            <article
              v-for="room in rooms"
              :key="room.matchID"
              class="rounded-2xl border border-white/10 bg-slate-800/55 px-4 py-4 shadow-[0_20px_45px_rgba(2,6,23,0.22)] backdrop-blur-sm transition hover:border-white/15 hover:bg-slate-800/70"
            >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-stretch gap-3">
                <span
                  v-if="room.is_private"
                  class="inline-flex min-h-full w-7 shrink-0 items-center justify-center self-stretch text-amber-100"
                  aria-label="Private room"
                  title="Private room"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
                <div class="min-w-0">
                  <h3 class="truncate text-base font-semibold text-slate-50 sm:text-lg">
                    {{ room.room_name || displayRoomID(room.matchID) }}
                  </h3>
                  <p v-if="room.creator_name" class="mt-1 font-mono text-xs text-slate-400">
                    {{ room.creator_name }}
                  </p>
                </div>
              </div>
            </div>

            <div class="shrink-0">
              <button
                v-if="!hasJoinedRoom(room.matchID)"
                type="button"
                class="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600"
                :disabled="isRoomFull(room)"
                @click="joinRoom(room.matchID)"
              >
                Join
              </button>
              <NuxtLink
                v-else
                :to="`/room/${room.matchID}`"
                class="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
              >
                Rejoin
              </NuxtLink>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-[1fr_auto] gap-3 text-sm">
            <div class="flex flex-col items-start">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Players</p>
              <p class="mt-1 text-base font-semibold text-slate-100">
                {{ joinedCount(room) }} / {{ totalPlayers(room) }}
              </p>
            </div>
            <div class="self-center justify-self-end text-center">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
              <div class="mt-2 flex items-center justify-center">
                <span class="inline-flex h-4 w-4 rounded-full" :class="roomStatusDotClass(room)" />
              </div>
            </div>
          </div>
            </article>
          </div>
        </div>
      </section>
    </div>
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

        <label class="block text-sm text-slate-400 mb-1">Room Name</label>
        <input
          v-model="createRoomName"
          type="text"
          maxlength="40"
          placeholder="Enter a room name"
          class="w-full bg-slate-700 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2"
          :class="roomNameTouched && createRoomName.trim().length < 3
            ? 'border border-red-400/70 focus:ring-red-400'
            : 'border border-slate-600 focus:ring-amber-500'"
          @blur="roomNameTouched = true"
        >

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

        <label class="mb-3 flex items-center gap-3 text-sm text-slate-200">
          <input
            v-model="createPrivateRoom"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500"
          >
          Private room
        </label>

        <div v-if="createPrivateRoom" class="space-y-4 mb-6">
          <input
            v-model="createRoomPassword"
            type="password"
            placeholder="Room password"
            class="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
          <input
            v-model="createRoomPasswordConfirm"
            type="password"
            placeholder="Confirm password"
            class="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
        </div>

        <button
          type="button"
          class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50"
          :disabled="creating"
          @click="doCreateRoom"
        >
          Create Room
        </button>
      </div>
    </div>
  </Teleport>
</template>
