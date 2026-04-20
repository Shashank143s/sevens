<script setup lang="ts">
import { useSevensClient } from '~/composables/useSevensClient'
import { useRoomCredentials } from '~/composables/useRoomCredentials'
import { useAdMob } from '~/composables/useAdMob'

export interface PlayerInfo {
  id: number
  name?: string | null
  avatar?: string
  isBot?: boolean
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
const { getAccount, rewardCoins } = useAccountApi()
const { completeGameRecord, getGameRecord } = useGameApi()
const admob = useAdMob()
const { topInsetCss } = useAndroidViewportInsets()

const players = ref<PlayerInfo[]>([])
const router = useRouter()
const { clearCredentials } = useRoomCredentials()
const { isOnline } = useOnlineStatus()

const winnerID = computed(() => state.value?.ctx?.gameover?.winner)
const isGameOver = computed(() => winnerID.value != null)
const isSocketConnected = computed(() => state.value?.isConnected !== false)
const showReconnectNotice = computed(() => !isGameOver.value && (!isOnline.value || !isSocketConnected.value))
const reconnectNoticeStyle = computed(() => ({
  top: `max(1rem, ${topInsetCss.value})`,
}))
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

const redirectSeconds = ref(30000)
const winnerCoinsDelta = ref<number | null>(null)
const winnerTotalCoins = ref<number | null>(null)
const startingCoinsBalance = ref<number | null>(null)
const rewardStatus = ref<string | null>(null)
const rewardLoading = ref(false)
const rewardClaimed = ref(false)
const rewardCoinBurstKey = ref(0)
const finalizedGame = ref<Awaited<ReturnType<typeof completeGameRecord>> | null>(null)
const gameFinishedLocally = ref(false)
const redirectDeadline = ref<number | null>(null)
let redirectTimer: ReturnType<typeof setInterval> | null = null
let deleteRequested = false
let completionSynced = false

function inferWinnerCoinDelta(game?: Awaited<ReturnType<typeof getGameRecord>>['game'] | null) {
  if (!game || !didIWin.value) return null

  const playersInGame = game.players ?? []
  const stake = Math.max(game.coin_rules?.stake ?? 10, 10)
  const humanPlayers = playersInGame.filter((player) => !player.is_bot)
  const botCount = playersInGame.filter((player) => player.is_bot).length

  if (humanPlayers.length === 0) return null

  return Math.max(0, (humanPlayers.length - 1) * stake + botCount * 10)
}

function clearRedirectTimer() {
  if (redirectTimer != null) {
    clearInterval(redirectTimer)
    redirectTimer = null
  }
}

function pauseRedirectTimer() {
  clearRedirectTimer()
}

function resumeRedirectTimer() {
  if (!gameFinishedLocally.value || redirectDeadline.value == null) return
  clearRedirectTimer()
  redirectTimer = setInterval(() => {
    void syncRedirectState()
  }, 1000)
  void syncRedirectState()
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
      rewardStatus.value = null
      rewardLoading.value = false
      rewardClaimed.value = false
      return
    }
    gameFinishedLocally.value = true
    winnerCoinsDelta.value = null
    winnerTotalCoins.value = null
    rewardStatus.value = null
    rewardLoading.value = false
    rewardClaimed.value = false
    rewardCoinBurstKey.value = 0
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
    resumeRedirectTimer()
  },
  { immediate: true },
)

async function loadWinnerEconomy() {
  if (!didIWin.value || !session.value?.id) return

  const accountIdentifier = session.value.id || session.value.email?.trim()
  if (!accountIdentifier) return
  const mySeatId = state.value?.playerID != null ? String(state.value.playerID) : null

  const finalizedWinner = finalizedGame.value?.game.players?.find((entry) =>
    entry.user_id === session.value?.id || (mySeatId != null && entry.player_id === mySeatId),
  )
  const finalizedDelta = finalizedWinner?.coins?.delta ?? null
  let resolvedDelta: number | null = null

  if (typeof finalizedDelta === 'number' && finalizedDelta > 0) {
    resolvedDelta = finalizedDelta
  } else {
    const inferredFinalizedDelta = inferWinnerCoinDelta(finalizedGame.value?.game ?? null)
    if (typeof inferredFinalizedDelta === 'number' && inferredFinalizedDelta > 0) {
      resolvedDelta = inferredFinalizedDelta
    }
  }

  if (resolvedDelta != null) {
    winnerCoinsDelta.value = resolvedDelta
    if (startingCoinsBalance.value != null) {
      winnerTotalCoins.value = startingCoinsBalance.value + resolvedDelta
    }
  }

  let latestObservedBalance: number | null = null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const [accountResponse, gameResponse] = await Promise.all([
        getAccount(accountIdentifier, 0, 0),
        attempt === 0 && finalizedGame.value ? Promise.resolve(finalizedGame.value) : getGameRecord(props.matchId),
      ])

      const latestBalance = accountResponse.user.wallet?.coins_balance ?? null
      latestObservedBalance = latestBalance ?? latestObservedBalance
      const player = gameResponse.game.players?.find((entry) =>
        entry.user_id === session.value?.id || (mySeatId != null && entry.player_id === mySeatId),
      )
      const latestDelta = player?.coins?.delta ?? null
      const effectiveDelta = (
        typeof finalizedDelta === 'number' && finalizedDelta > 0
          ? finalizedDelta
          : (typeof latestDelta === 'number' && latestDelta > 0
            ? latestDelta
            : inferWinnerCoinDelta(gameResponse.game))
      )

      if (typeof effectiveDelta === 'number' && effectiveDelta > 0) {
        resolvedDelta = effectiveDelta
        winnerCoinsDelta.value = effectiveDelta
      }

      const expectedBalance = (
        startingCoinsBalance.value != null
        && typeof resolvedDelta === 'number'
        && resolvedDelta > 0
      ) ? startingCoinsBalance.value + resolvedDelta : null

      if (expectedBalance != null) {
        winnerTotalCoins.value = latestBalance != null
          ? Math.max(latestBalance, expectedBalance)
          : expectedBalance
      } else if (latestBalance != null) {
        winnerTotalCoins.value = latestBalance
      }

      if ((winnerCoinsDelta.value == null || winnerCoinsDelta.value <= 0) && startingCoinsBalance.value != null && latestBalance != null) {
        const inferredDeltaFromWallet = latestBalance - startingCoinsBalance.value
        if (inferredDeltaFromWallet > 0) {
          resolvedDelta = inferredDeltaFromWallet
          winnerCoinsDelta.value = inferredDeltaFromWallet
          winnerTotalCoins.value = latestBalance
        }
      }

      if (winnerTotalCoins.value != null && typeof winnerCoinsDelta.value === 'number' && winnerCoinsDelta.value > 0) {
        return
      }
    } catch (error) {
      console.error('[game-board] Failed to load winner economy:', error)
    }

    await new Promise(resolve => setTimeout(resolve, 550))
  }

  if (winnerTotalCoins.value == null) {
    if (startingCoinsBalance.value != null && typeof winnerCoinsDelta.value === 'number' && winnerCoinsDelta.value > 0) {
      winnerTotalCoins.value = startingCoinsBalance.value + winnerCoinsDelta.value
    } else if (latestObservedBalance != null) {
      winnerTotalCoins.value = latestObservedBalance
    }
  }
}

async function watchRewardVideo() {
  if (rewardLoading.value || rewardClaimed.value || !session.value?.id || !admob.canUseAdMob.value) return

  const accountIdentifier = session.value.id || session.value.email?.trim()
  if (!accountIdentifier) {
    rewardStatus.value = 'No signed-in account is available to credit.'
    return
  }

  pauseRedirectTimer()
  rewardLoading.value = true
  rewardStatus.value = 'Preparing reward video...'

  let rewardGranted = false
  let cleanupRewardListeners: null | (() => Promise<void>) = null

  try {
    cleanupRewardListeners = await admob.registerEventListeners({
      onRewardShowed: () => {
        rewardStatus.value = 'Reward video is playing...'
      },
      onRewarded: () => {
        rewardGranted = true
        rewardStatus.value = 'Reward earned. Crediting 5 bonus coins...'
      },
      onRewardFailed: (message) => {
        if (!rewardGranted) {
          rewardStatus.value = message ? `Reward video failed: ${message}` : 'Reward video failed to load.'
        }
      },
    })

    const reward = await admob.showRewarded().catch((error) => {
      console.error('[game-board] Rewarded video could not be shown:', error)
      return null
    })

    if (!rewardGranted && !reward) {
      rewardStatus.value = 'Reward video was skipped or interrupted.'
      return
    }

    rewardStatus.value = 'Reward earned. Crediting 5 bonus coins...'
    const response = await rewardCoins(accountIdentifier, 5, 'rewarded_video')
    rewardClaimed.value = true
    rewardCoinBurstKey.value += 1

    const responseBalance = response.user.wallet?.coins_balance ?? null
    if (responseBalance != null) {
      winnerTotalCoins.value = responseBalance
    } else if (winnerTotalCoins.value != null) {
      winnerTotalCoins.value += 5
    } else if (startingCoinsBalance.value != null) {
      winnerTotalCoins.value = startingCoinsBalance.value + 5
    }

    try {
      const refreshedAccount = await getAccount(accountIdentifier, 0, 0)
      const refreshedBalance = refreshedAccount.user.wallet?.coins_balance ?? null
      if (refreshedBalance != null) {
        winnerTotalCoins.value = refreshedBalance
      }
    } catch (error) {
      console.error('[game-board] Failed to refresh rewarded wallet balance:', error)
    }

    winnerCoinsDelta.value = (winnerCoinsDelta.value ?? 0) + 5
    rewardStatus.value = `5 bonus coins added. Balance: ${winnerTotalCoins.value ?? '—'}`
  } catch (error) {
    console.error('[game-board] Failed to show or credit reward video:', error)
    rewardStatus.value = rewardEarned
      ? 'Reward earned, but coin credit failed.'
      : 'Reward video was skipped or interrupted.'
  } finally {
    await cleanupRewardListeners?.()
    rewardLoading.value = false
    resumeRedirectTimer()
  }
}

async function syncCompletedGame() {
  if (completionSynced || winnerID.value == null || state.value?.playerID == null) return
  completionSynced = true
  let lastError: unknown = null
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const completed = await completeGameRecord(props.matchId, String(winnerID.value))
        finalizedGame.value = completed
        const settlementStatus = completed?.game?.coin_settlement?.status
        if (settlementStatus === 'completed' || settlementStatus === 'void') {
          return
        }
      } catch (error) {
        lastError = error
      }
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
    }
    if (lastError) {
      throw lastError
    }
    throw new Error('Game settlement did not complete in time.')
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
      players?: Array<{ id?: number; name?: string | null; data?: { avatar?: string }; is_bot?: boolean }>
    }
    if (Array.isArray(data.players)) {
      players.value = data.players.map((p, i) => ({
        id: p.id ?? i,
        name: p.name ?? null,
        avatar: p.data?.avatar,
        isBot: p.is_bot ?? false,
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

async function captureStartingCoinsBalance() {
  if (!session.value?.id) return

  const accountIdentifier = session.value.id || session.value.email?.trim()
  if (!accountIdentifier) return

  try {
    const accountResponse = await getAccount(accountIdentifier, 0, 0)
    startingCoinsBalance.value = accountResponse.user.wallet?.coins_balance ?? null
  } catch (error) {
    console.error('[game-board] Failed to capture starting wallet balance:', error)
  }
}

onMounted(() => {
  void captureStartingCoinsBalance()
})
</script>

<template>
  <div v-if="state" class="sevens-game-wrapper">
    <div
      v-if="showReconnectNotice"
      class="fixed left-4 right-4 z-[9998] mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900/88 px-4 py-3 text-white shadow-2xl backdrop-blur-sm"
      :style="reconnectNoticeStyle"
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
      :reward-available="admob.canUseAdMob.value"
      :reward-loading="rewardLoading"
      :reward-claimed="rewardClaimed"
      :reward-status="rewardStatus"
      :reward-coin-burst-key="rewardCoinBurstKey"
      @go-lobby="router.push('/lobby')"
      @watch-reward="watchRewardVideo"
    />
    <GameBoard
      :G="state.G"
      :ctx="state.ctx"
      :moves="state.moves"
      :player-id="state.playerID"
      :players="players"
    />
  </div>
</template>
