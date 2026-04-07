<script setup lang="ts">
import coinSoundSrc from '~/assets/audio/coin.mp3'
import winSoundSrc from '~/assets/audio/win_sound.mp3'
import loseSoundSrc from '~/assets/audio/lose_sound.mp3'

const props = defineProps<{
  avatar: string
  winnerName: string
  didIWin: boolean
  redirectSeconds: number
  wonCoins?: number | null
  totalCoins?: number | null
}>()

const emit = defineEmits<{
  goLobby: []
}>()

const showCoinTransfer = computed(() => props.didIWin && (props.wonCoins ?? 0) > 0 && props.totalCoins != null)
const coinTrail = Array.from({ length: 5 }, (_, index) => index)
let coinAudio: HTMLAudioElement | null = null
let outcomeAudio: HTMLAudioElement | null = null
let coinSoundDelayTimer: ReturnType<typeof setTimeout> | null = null

function stopCoinSound() {
  if (coinAudio) {
    coinAudio.pause()
    coinAudio.currentTime = 0
  }
}

function stopOutcomeSound() {
  if (outcomeAudio) {
    outcomeAudio.pause()
    outcomeAudio.currentTime = 0
  }
}

function clearCoinSoundDelay() {
  if (coinSoundDelayTimer) {
    clearTimeout(coinSoundDelayTimer)
    coinSoundDelayTimer = null
  }
}

function playCoinRewardSound() {
  if (!import.meta.client || typeof window === 'undefined') return
  try {
    if (!coinAudio) {
      coinAudio = new Audio(coinSoundSrc)
      coinAudio.preload = 'auto'
      coinAudio.volume = 0.6
    }
    coinAudio.currentTime = 0
    void coinAudio.play().catch(() => {})
  } catch {
    // ignore audio failures
  }
}

function playOutcomeSound() {
  if (!import.meta.client || typeof window === 'undefined') return
  try {
    stopOutcomeSound()
    outcomeAudio = new Audio(props.didIWin ? winSoundSrc : loseSoundSrc)
    outcomeAudio.preload = 'auto'
    outcomeAudio.volume = props.didIWin ? 0.72 : 0.68
    void outcomeAudio.play().catch(() => {})
  } catch {
    // ignore audio failures
  }
}

watch(
  () => props.didIWin,
  (_, __, onCleanup) => {
    playOutcomeSound()
    onCleanup(() => {
      stopOutcomeSound()
    })
  },
  { immediate: true },
)

watch(showCoinTransfer, (active, wasActive) => {
  if (!active || wasActive) return
  clearCoinSoundDelay()
  coinSoundDelayTimer = setTimeout(() => {
    playCoinRewardSound()
    coinSoundDelayTimer = null
  }, 520)
}, { immediate: true })

onUnmounted(() => {
  clearCoinSoundDelay()
  stopCoinSound()
  stopOutcomeSound()
})
</script>

<template>
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/78 p-4 text-white backdrop-blur-sm safe-area-padding">
    <div class="w-full max-w-md overflow-hidden rounded-[1.9rem] border border-white/10 bg-slate-900/95 text-white shadow-[0_30px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl">
      <div class="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_28%),radial-gradient(circle_at_left_center,rgba(56,189,248,0.12),transparent_34%),linear-gradient(145deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] px-5 py-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-amber-300/80">
              {{ didIWin ? 'Victory' : 'Round Complete' }}
            </p>
            <h2 class="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {{ didIWin ? 'You won' : 'You lost' }}
            </h2>
            <p class="mt-2 text-sm text-slate-300">
              {{ didIWin ? 'Your final sequence landed perfectly.' : 'The table closed with another winner this round.' }}
            </p>
          </div>
          <div class="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-white/5 text-4xl shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
            {{ avatar }}
          </div>
        </div>
      </div>

      <div class="space-y-4 p-5">
        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div class="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-400">Winner</div>
          <div class="mt-2 text-lg font-bold text-slate-50">
            {{ winnerName }}
          </div>
        </div>

        <div
          v-if="didIWin && (wonCoins != null || totalCoins != null)"
          class="winner-overlay__economy grid grid-cols-2 gap-3"
        >
          <div
            v-if="wonCoins != null"
            class="winner-overlay__economy-card rounded-2xl border border-emerald-300/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.14),rgba(15,23,42,0.35))] px-4 py-3"
          >
            <div class="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-200/80">
              Won
            </div>
            <div class="mt-2 inline-flex items-center gap-2 text-lg font-extrabold text-emerald-50">
              <span>+{{ wonCoins }}</span>
              <IconsCoinIcon class="h-5 w-5" />
            </div>
          </div>

          <div
            v-if="totalCoins != null"
            class="winner-overlay__economy-card winner-overlay__economy-card--wallet rounded-2xl border border-amber-300/15 bg-[linear-gradient(180deg,rgba(250,204,21,0.12),rgba(15,23,42,0.35))] px-4 py-3"
            :class="{ 'winner-overlay__economy-card--wallet-pulse': showCoinTransfer }"
          >
            <div class="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-200/80">
              Wallet
            </div>
            <div class="mt-2 inline-flex items-center gap-2 text-lg font-extrabold text-amber-50">
              <span>{{ totalCoins }}</span>
              <IconsCoinIcon class="h-5 w-5" />
            </div>
          </div>

          <div
            v-if="showCoinTransfer"
            class="winner-overlay__coin-flow"
            aria-hidden="true"
          >
            <span
              v-for="coin in coinTrail"
              :key="coin"
              class="winner-overlay__coin"
              :style="{ '--coin-delay': `${coin * 160}ms` }"
            >
              <IconsCoinIcon class="h-4 w-4" />
            </span>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400 px-4 py-3 font-bold text-slate-950 shadow-[0_18px_40px_rgba(245,158,11,0.18)] transition hover:bg-amber-300"
          @click="emit('goLobby')"
        >
          Go to Lobby ({{ redirectSeconds }}s)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.winner-overlay__economy {
  position: relative;
}

.winner-overlay__economy-card {
  position: relative;
  overflow: hidden;
}

.winner-overlay__economy-card--wallet {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 0 22px rgba(250, 204, 21, 0.1);
}

.winner-overlay__economy-card--wallet-pulse {
  animation: winner-overlay-wallet-pulse 520ms ease-out 2.6s 1 both;
}

.winner-overlay__coin-flow {
  pointer-events: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.winner-overlay__coin {
  position: absolute;
  left: 24%;
  top: 58%;
  color: #facc15;
  opacity: 0;
  filter: drop-shadow(0 0 14px rgba(250, 204, 21, 0.42));
  animation: winner-overlay-coin-transfer 900ms cubic-bezier(0.22, 1, 0.36, 1) 3;
  animation-delay: var(--coin-delay);
  animation-fill-mode: both;
}

@keyframes winner-overlay-coin-transfer {
  0% {
    transform: translate(0, 0) scale(0.82);
    opacity: 0;
  }
  14% {
    opacity: 1;
  }
  55% {
    transform: translate(74px, -20px) scale(1.08);
    opacity: 1;
  }
  100% {
    transform: translate(148px, -10px) scale(0.92);
    opacity: 0;
  }
}

@keyframes winner-overlay-wallet-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 0 22px rgba(250, 204, 21, 0.1);
  }
  50% {
    transform: scale(1.035);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 0 34px rgba(250, 204, 21, 0.24);
  }
}
</style>
