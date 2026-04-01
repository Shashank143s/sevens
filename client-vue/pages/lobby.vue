<script setup lang="ts">
import { listMatches, createMatch, joinBots } from '~/composables/useLobbyApi'
import type { LobbyMatch } from '~/composables/useLobbyApi'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import backgroundGame from '~/assets/images/poker_cards_table.png'

const router = useRouter()
const { session } = usePlayerSession()
const { getCredentials, setRoomMeta } = useRoomCredentials()
const { createGameRecord } = useGameApi()
const { getAccountSummary } = useAccountApi()
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
const createStake = ref(10)
const creating = ref(false)
const reconnecting = ref(false)
const coinsBalance = ref<number | null>(null)
const createPrivateRoom = ref(false)
const createRoomPassword = ref('')
const createRoomName = ref('')
const roomNameTouched = ref(false)
const stakeTouched = ref(false)

const createRoomDisabled = computed(() => !isOnline.value || (coinsBalance.value != null && coinsBalance.value < 10))
const botOptions = computed(() => {
  const maxBots = Math.max(createNumPlayers.value - 1, 0)
  return Array.from({ length: maxBots + 1 }, (_, value) => value)
})
const coinsBalanceLabel = computed(() => {
  if (coinsBalance.value == null) return null
  return `${coinsBalance.value}`
})
const coinsBalanceToneClass = computed(() => {
  if (coinsBalance.value == null) return ''
  if (coinsBalance.value >= 100) {
    return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100 shadow-[0_10px_25px_rgba(16,185,129,0.12)]'
  }
  if (coinsBalance.value >= 25) {
    return 'border-amber-300/25 bg-amber-500/10 text-amber-100 shadow-[0_10px_25px_rgba(245,158,11,0.12)]'
  }
  return 'border-red-500 bg-red-500/12 text-red-50 shadow-[0_10px_25px_rgba(239,68,68,0.18)]'
})
const roomNameError = computed(() => {
  if (!roomNameTouched.value) return ''
  const roomName = createRoomName.value.trim()
  if (roomName.length < 3) return 'Use at least 3 characters.'
  if (roomName.length > 40) return 'Keep it under 40 characters.'
  return ''
})
const stakeError = computed(() => {
  if (!stakeTouched.value) return ''
  if (!Number.isFinite(createStake.value) || createStake.value < 10) return 'Minimum stake is 10.'
  if (coinsBalance.value != null && createStake.value > coinsBalance.value) return 'Low balance.'
  return ''
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
    const [coinsResult, roomsResult] = await Promise.allSettled([
      refreshCoinsBalance(),
      listMatches(),
    ])

    if (coinsResult.status === 'rejected') {
      console.error('[lobby] Failed to refresh coins balance:', coinsResult.reason)
    }

    if (roomsResult.status === 'fulfilled') {
      rooms.value = roomsResult.value
    } else {
      throw roomsResult.reason
    }
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
  createStake.value = 10
  createRoomName.value = ''
  roomNameTouched.value = false
  stakeTouched.value = false
  createPrivateRoom.value = false
  createRoomPassword.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function adjustStake(direction: 'up' | 'down') {
  stakeTouched.value = true
  const nextValue = Number.isFinite(createStake.value) ? createStake.value : 10
  createStake.value = Math.max(10, nextValue + (direction === 'up' ? 10 : -10))
}

function normalizeStakeInput() {
  stakeTouched.value = true
  const normalized = Number.isFinite(createStake.value) ? Math.round(createStake.value / 10) * 10 : 10
  createStake.value = Math.max(10, normalized)
}

async function doCreateRoom() {
  if (!isOnline.value) {
    error.value = 'Reconnect before creating a room.'
    return
  }
  if (coinsBalance.value != null && coinsBalance.value < 10) {
    error.value = 'You need at least 10 available coins to create a room.'
    return
  }
  if (!Number.isFinite(createStake.value) || createStake.value < 10) {
    stakeTouched.value = true
    error.value = 'Stake per player must be at least 10 coins.'
    return
  }
  if (coinsBalance.value != null && createStake.value > coinsBalance.value) {
    stakeTouched.value = true
    error.value = 'Low balance for the selected stake.'
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
    await refreshCoinsBalance()
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
      coin_rules: {
        stake: createStake.value,
      },
      access: {
        is_private: createPrivateRoom.value,
        password: createRoomPassword.value,
      },
      metadata: {
        source: 'web',
      },
    })
    setRoomMeta(matchID, {
      creatorOwned: true,
      roomName: createRoomName.value.trim(),
      roomPassword: createPrivateRoom.value ? createRoomPassword.value : undefined,
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

async function refreshCoinsBalance() {
  const identifier = session.value?.id || session.value?.email?.trim()
  if (!identifier) return
  const response = await getAccountSummary(identifier)
  coinsBalance.value = response.user.wallet?.coins_balance ?? null
}

function validatePrivateRoomPassword() {
  const password = createRoomPassword.value.trim()
  if (password.length < 4) {
    error.value = 'Private room passwords must be at least 4 characters.'
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

watch(createNumPlayers, () => {
  const maxBots = Math.max(createNumPlayers.value - 1, 0)
  if (createAiBots.value > maxBots) {
    createAiBots.value = maxBots
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
    class="box-border h-[100dvh] overflow-hidden bg-slate-900 text-white p-4 sm:p-6 safe-area-padding bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <header class="mb-6 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="flex items-center gap-2 text-slate-400 hover:text-white">
        ← Back
      </NuxtLink>
      <AppUserMenu />
    </header>

    <div class="mx-auto w-full max-w-5xl">
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

      <section class="flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] shadow-[0_30px_80px_rgba(2,6,23,0.42)] backdrop-blur-xl">
        <div class="shrink-0 flex items-center justify-between gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_left_center,rgba(250,204,21,0.12),transparent_32%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] px-4 py-3.5">
          <div class="min-w-0">
            <p class="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-sky-300/80">Live Lobby</p>
            <h2 class="mt-1 font-semibold text-slate-100">Available Rooms</h2>
          </div>
          <div class="flex items-center gap-3">
            <div
              v-if="coinsBalanceLabel"
              class="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold"
              :class="coinsBalanceToneClass"
            >
              <IconsCoinIcon class="mr-2 h-4 w-4" />
              {{ coinsBalanceLabel }}
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-slate-900/70 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition hover:bg-slate-800/85 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div v-if="loading" class="flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-3 sm:p-4">
          <div class="space-y-3">
            <RoomCardSkeleton
              v-for="index in 3"
              :key="index"
            />
          </div>
        </div>
        <div v-else-if="rooms.length === 0" class="flex flex-1 items-center justify-center px-4 py-10 text-center text-slate-400">
          No rooms available. Create one to start playing!
        </div>
        <div v-else class="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-3 sm:p-4">
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

          <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div class="flex min-w-0 flex-col items-center text-center">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Players</p>
                <p class="mt-1 text-base font-semibold text-slate-100">
                  {{ joinedCount(room) }} / {{ totalPlayers(room) }}
                </p>
              </div>
              <div class="flex flex-col items-center text-center">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Stake</p>
                <p class="mt-1 inline-flex items-center justify-center gap-2 text-base font-semibold text-amber-200">
                  {{ room.coin_stake ?? 10 }}
                  <IconsCoinIcon class="h-4 w-4" />
                </p>
              </div>
            <div class="flex min-w-0 flex-col items-center text-center">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
              <div class="mt-2 flex w-full items-center justify-center">
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
      <div class="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/95 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <div class="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_32%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] px-5 py-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-amber-300/80">New Table</p>
              <h2 class="mt-1 text-xl font-bold text-white">Create a Room</h2>
            </div>
            <div class="flex items-center gap-2">
              <div class="inline-flex items-center rounded-full border border-amber-300/15 bg-white/5 px-3 py-1 text-sm font-semibold text-amber-100">
                <IconsCoinIcon class="mr-2 h-4 w-4" />
                {{ coinsBalanceLabel ?? '—' }}
              </div>
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-slate-400 transition hover:bg-white/8 hover:text-white"
                aria-label="Close"
                @click="closeCreateModal"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        <div class="p-5">
        <label class="block text-sm font-semibold text-slate-300 mb-1.5">Room Name</label>
        <input
          v-model="createRoomName"
          type="text"
          maxlength="40"
          placeholder="Friday Night Table"
          class="w-full bg-slate-800/80 rounded-2xl px-4 py-3 text-white mb-1.5 focus:outline-none focus:ring-2"
          :class="roomNameError
            ? 'border border-red-400/70 focus:ring-red-400'
            : 'border border-slate-600 focus:ring-amber-500'"
          @blur="roomNameTouched = true"
        >
        <p v-if="roomNameError" class="mb-4 text-xs font-semibold text-red-300">{{ roomNameError }}</p>
        <div v-else class="mb-4" />

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1.5">Players</label>
            <div class="relative">
              <select
                v-model.number="createNumPlayers"
                class="w-full appearance-none bg-slate-800/80 border border-slate-600 rounded-2xl px-4 py-3 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option :value="2">2 Players</option>
                <option :value="3">3 Players</option>
                <option :value="4">4 Players</option>
              </select>
              <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300">
                <svg
                  viewBox="0 0 20 20"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-300 mb-1.5">Bots</label>
            <div class="relative">
              <select
                v-model.number="createAiBots"
                class="w-full appearance-none bg-slate-800/80 border border-slate-600 rounded-2xl px-4 py-3 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option
                  v-for="option in botOptions"
                  :key="option"
                  :value="option"
                >
                  {{ option === 0 ? 'None' : `${option}` }}
                </option>
              </select>
              <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300">
                <svg
                  viewBox="0 0 20 20"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div class="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <label class="block text-sm font-semibold text-slate-200">Stake per Player</label>
              <p class="mt-1 text-xs text-slate-400">Minimum 10 coins. Must not exceed your balance.</p>
            </div>
            <div class="flex flex-col items-center">
              <div class="inline-flex items-center rounded-full border border-white/10 bg-slate-950/70 p-1">
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-200 transition hover:bg-white/8"
                  aria-label="Decrease stake"
                  @click="adjustStake('down')"
                >
                  −
                </button>
                <input
                  v-model.number="createStake"
                  type="number"
                  min="10"
                  step="10"
                  class="w-14 bg-transparent px-1 text-center text-base font-bold text-amber-100 focus:outline-none"
                  @blur="normalizeStakeInput"
                  @input="stakeTouched = true"
                >
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-slate-200 transition hover:bg-white/8"
                  aria-label="Increase stake"
                  @click="adjustStake('up')"
                >
                  +
                </button>
              </div>
              <p v-if="stakeError" class="mt-2 text-xs font-semibold text-red-300">{{ stakeError }}</p>
            </div>
          </div>
        </div>

        <div class="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-slate-200">Private room</p>
            <p class="mt-1 text-xs text-slate-400">Only players with the password can join.</p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-7 w-12 items-center rounded-full border transition"
            :class="createPrivateRoom ? 'border-amber-300/40 bg-amber-400/80' : 'border-white/10 bg-slate-800/80'"
            role="switch"
            :aria-checked="createPrivateRoom"
            aria-label="Toggle private room"
            @click="createPrivateRoom = !createPrivateRoom"
          >
            <span
              class="inline-flex h-5 w-5 transform rounded-full bg-white shadow transition"
              :class="createPrivateRoom ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>

        <div v-if="createPrivateRoom" class="grid gap-3 mb-5">
          <input
            v-model="createRoomPassword"
            type="password"
            placeholder="Room password"
            class="w-full bg-slate-800/80 border border-slate-600 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
        </div>

        <button
          type="button"
          class="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-2xl touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50"
          :disabled="creating || !!roomNameError || !!stakeError"
          @click="doCreateRoom"
        >
          Create Room
        </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
