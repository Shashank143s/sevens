<script setup lang="ts">
import RoomCard from '~/components/RoomCard.vue'
import AdMobBottomBanner from '~/components/AdMobBottomBanner.vue'
import { listMatches, createMatch, joinBots } from '~/composables/useLobbyApi'
import type { LobbyMatch } from '~/composables/useLobbyApi'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import backgroundGame from '~/assets/images/poker_cards_table.png'

const router = useRouter()
const { session } = usePlayerSession()
const { onlineCount } = useLobbyPresenceState()
const { getCredentials, setRoomMeta } = useRoomCredentials()
const { createGameRecord } = useGameApi()
const { getAccountSummary } = useAccountApi()
const { isOnline } = useOnlineStatus()
const { isCompact } = useUiDensity()
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
const botsAutoFillEnabled = ref(true)
const createStake = ref(10)
const creating = ref(false)
const reconnecting = ref(false)
const coinsBalance = ref<number | null>(null)
const createPrivateRoom = ref(false)
const createRoomPassword = ref('')
const createRoomName = ref('')
const roomNameTouched = ref(false)
const stakeTouched = ref(false)
const showBotsInfo = ref(false)

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
const roomSetupSummary = computed(() => {
  const totalSeats = createNumPlayers.value
  const botCount = Math.max(0, Math.min(createAiBots.value, totalSeats - 1))
  const humanPlayers = Math.max(totalSeats - botCount, 1)
  return `${humanPlayers} human player${humanPlayers === 1 ? '' : 's'} + ${botCount} bot${botCount === 1 ? '' : 's'}`
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
const onlineUsersLabel = computed(() => {
  const count = onlineCount.value
  return `${count} online`
})

function joinedCount(m: LobbyMatch): number {
  return m.joined_count ?? m.players?.filter((p: any) => p.name != null && p.name !== '')?.length ?? 0
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
  createAiBots.value = 1
  botsAutoFillEnabled.value = true
  createStake.value = 10
  createRoomName.value = ''
  roomNameTouched.value = false
  stakeTouched.value = false
  createPrivateRoom.value = false
  createRoomPassword.value = ''
  showBotsInfo.value = false
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  showBotsInfo.value = false
}

function handleCreateNumPlayersUpdate(value: number) {
  createNumPlayers.value = value
  if (botsAutoFillEnabled.value) {
    createAiBots.value = Math.max(0, value - 1)
  }
}

function handleCreateAiBotsUpdate(value: number) {
  botsAutoFillEnabled.value = false
  createAiBots.value = value
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
  if (botsAutoFillEnabled.value) {
    createAiBots.value = maxBots
    return
  }
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
    class="lobby-page box-border h-[100dvh] overflow-hidden bg-slate-900 text-white p-4 sm:p-6 safe-area-padding bg-cover bg-center bg-no-repeat"
    :class="{ 'lobby-page--compact': isCompact }"
    :style="{ backgroundImage: `url(${backgroundGame})` }"
  >
    <AppTopBar back-to="/" back-label="Back" />

    <div class="mx-auto w-full max-w-5xl">
      <div
        v-if="lobbyStatus"
        class="mb-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm"
        :class="[
          isOnline ? 'border-amber-400/20 bg-slate-900/70 text-slate-200' : 'border-red-400/20 bg-red-950/40 text-red-100',
        ]"
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

      <section
        class="flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-[0.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] shadow-[0_30px_80px_rgba(2,6,23,0.42)] backdrop-blur-xl"
      >
        <div
          class="shrink-0 flex items-center justify-between gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_left_center,rgba(250,204,21,0.12),transparent_32%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] px-4 py-3.5"
        >
          <div class="min-w-0">
            <p class="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-sky-300/80">Live Lobby</p>
            <h2 class="mt-1 font-semibold text-slate-100">Available Rooms</h2>
          </div>
          <div class="flex items-center gap-3">
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
        <div class="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/55 px-4 py-3">
          <div
            class="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 shadow-[0_10px_25px_rgba(16,185,129,0.12)]"
            :title="`${onlineCount} connected player${onlineCount === 1 ? '' : 's'}`"
          >
            <span class="mr-2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
            {{ onlineUsersLabel }}
          </div>
          <div
            v-if="coinsBalanceLabel"
            class="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold"
            :class="coinsBalanceToneClass"
          >
            <IconsCoinIcon class="mr-2 h-4 w-4" />
            {{ coinsBalanceLabel }}
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
        <div v-else-if="rooms.length === 0" class="flex min-h-[22rem] flex-1 items-center justify-center px-4 py-10 text-center text-slate-300">
          <div class="max-w-md">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/20 bg-amber-400/10 text-amber-200 shadow-[0_14px_30px_rgba(245,158,11,0.12)]">
              <svg
                viewBox="0 0 24 24"
                class="h-7 w-7"
                fill="none"
                stroke="currentColor"
                stroke-width="2.1"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <p class="text-lg font-semibold text-slate-100">No rooms available.</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">
              Create a room to start a table and invite others in.
            </p>
            <button
              type="button"
              class="mt-5 inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_16px_36px_rgba(245,158,11,0.22)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="createRoomDisabled"
              @click="openCreateModal"
            >
              Create a Room
            </button>
          </div>
        </div>
        <div v-else class="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.05),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-3 sm:p-4">
          <div class="space-y-3">
            <RoomCard
              v-for="room in rooms"
              :key="room.matchID"
              :room="room"
              :joined-count="joinedCount(room)"
              :total-players="totalPlayers(room)"
              :has-joined="hasJoinedRoom(room.matchID)"
              :is-full="isRoomFull(room)"
              :status-dot-class="roomStatusDotClass(room)"
              :display-title="room.room_name || displayRoomID(room.matchID)"
              @join="joinRoom"
            />
          </div>
        </div>
      </section>
    </div>
  </div>

  <CreateRoomModal
    :visible="showCreateModal"
    :coins-balance-label="coinsBalanceLabel"
    :bot-options="botOptions"
    :creating="creating"
    :create-num-players="createNumPlayers"
    :create-ai-bots="createAiBots"
    :create-stake="createStake"
    :create-private-room="createPrivateRoom"
    :create-room-password="createRoomPassword"
    :create-room-name="createRoomName"
    :room-name-error="roomNameError"
    :stake-error="stakeError"
    :show-bots-info="showBotsInfo"
    :room-setup-summary="roomSetupSummary"
    @close="closeCreateModal"
    @submit="doCreateRoom"
    @room-name-blur="roomNameTouched = true"
    @normalize-stake-input="normalizeStakeInput"
    @mark-stake-touched="stakeTouched = true"
    @decrement-stake="adjustStake('down')"
    @increment-stake="adjustStake('up')"
    @update:create-num-players="handleCreateNumPlayersUpdate"
    @update:create-ai-bots="handleCreateAiBotsUpdate"
    @update:create-stake="createStake = $event"
    @update:create-private-room="createPrivateRoom = $event"
    @update:create-room-password="createRoomPassword = $event"
    @update:create-room-name="createRoomName = $event"
    @update:show-bots-info="showBotsInfo = $event"
  />

  <AdMobBottomBanner />
</template>

<style scoped>
.lobby-page {
  padding-bottom: calc(max(2rem, env(safe-area-inset-bottom)) + 50px);
}

.lobby-page--compact {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  padding-left: max(0.35rem, env(safe-area-inset-left));
  padding-right: max(0.35rem, env(safe-area-inset-right));
}

.lobby-page--compact > .mx-auto {
  max-width: 72rem;
}

.lobby-page--compact section {
  max-height: calc(100dvh - 8.4rem);
}

.lobby-page--compact .space-y-3 > * + * {
  margin-top: 0.5rem;
}

.lobby-page--compact .mb-4.rounded-2xl.border.px-4.py-3.text-sm {
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.lobby-page--compact .shrink-0.flex.items-center.justify-between.gap-3.border-b {
  padding: 0.62rem 0.75rem;
}

.lobby-page--compact .shrink-0 .text-\[0\.68rem\] {
  font-size: 0.58rem;
  letter-spacing: 0.18em;
}

.lobby-page--compact .shrink-0 h2 {
  margin-top: 0.125rem;
  font-size: 0.9rem;
}

.lobby-page--compact .flex.items-center.gap-3 {
  gap: 0.5rem;
}

.lobby-page--compact .inline-flex.h-8.w-8 {
  height: 1.75rem;
  width: 1.75rem;
}

.lobby-page--compact .inline-flex.h-8.w-8 .h-4.w-4 {
  height: 0.875rem;
  width: 0.875rem;
}

.lobby-page--compact .flex-1.overflow-y-auto.p-3 {
  padding: 0.625rem;
}
</style>
