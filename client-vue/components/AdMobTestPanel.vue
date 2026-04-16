<script setup lang="ts">
import { useAdMob } from '~/composables/useAdMob'
import { useAccountApi } from '~/composables/useAccountApi'

const admob = useAdMob()
const { rewardCoins } = useAccountApi()
const { session, hydrated } = usePlayerSession()

const isBusy = ref(false)
const statusMessage = ref('Ready to load Google test ads.')
const cleanupListeners = ref<null | (() => Promise<void>)>(null)
const rewardCreditClaimed = ref(false)

const accountIdentifier = computed(() => {
  if (!hydrated.value) return ''
  return session.value?.id || session.value?.email?.trim() || ''
})

async function runAction(action: () => Promise<boolean>, successMessage: string) {
  if (isBusy.value) return
  isBusy.value = true
  try {
    const didRun = await action()
    statusMessage.value = didRun ? successMessage : 'AdMob is not available on this session.'
  } catch (error) {
    console.error('[admob-test-panel] Ad action failed:', error)
    statusMessage.value = 'The ad request failed to load.'
  } finally {
    isBusy.value = false
  }
}

async function creditRewardIfNeeded(reward?: { amount: number; type: string } | null) {
  if (!reward || rewardCreditClaimed.value) return
  rewardCreditClaimed.value = true
  statusMessage.value = `Reward earned: ${reward.amount} ${reward.type}. Crediting 5 coins...`
  if (!accountIdentifier.value) {
    rewardCreditClaimed.value = false
    statusMessage.value = 'Reward earned, but no account was available to credit.'
    return
  }

  try {
    const response = await rewardCoins(accountIdentifier.value, 5, 'rewarded_video')
    statusMessage.value = `Reward credited. Balance: ${response.user.wallet?.coins_balance ?? '—'}`
  } catch (error) {
    console.error('[admob-test-panel] Failed to credit reward coins:', error)
    statusMessage.value = 'Reward earned, but coin credit failed.'
    rewardCreditClaimed.value = false
  }
}

async function requestRewardedAd() {
  if (isBusy.value) return
  isBusy.value = true
  rewardCreditClaimed.value = false
  try {
    const reward = await admob.showRewarded()
    if (reward) {
      await creditRewardIfNeeded(reward)
    } else {
      statusMessage.value = 'AdMob is not available on this session.'
    }
  } catch (error) {
    console.error('[admob-test-panel] Rewarded ad failed:', error)
    statusMessage.value = 'The rewarded ad failed to load.'
  } finally {
    isBusy.value = false
  }
}

async function setupListeners() {
  cleanupListeners.value = await admob.registerEventListeners({
    onBannerLoaded: () => {
      statusMessage.value = 'Banner loaded.'
    },
    onBannerFailed: (message) => {
      statusMessage.value = message ? `Banner failed to load: ${message}` : 'Banner failed to load.'
    },
    onBannerOpened: () => {
      statusMessage.value = 'Banner opened.'
    },
    onBannerClosed: () => {
      statusMessage.value = 'Banner closed.'
    },
    onInterstitialLoaded: () => {
      statusMessage.value = 'Interstitial loaded.'
    },
    onInterstitialFailed: (message) => {
      statusMessage.value = message ? `Interstitial failed to load: ${message}` : 'Interstitial failed to load.'
    },
    onInterstitialShowed: () => {
      statusMessage.value = 'Interstitial shown.'
    },
    onInterstitialDismissed: () => {
      statusMessage.value = 'Interstitial dismissed.'
    },
    onRewardLoaded: () => {
      statusMessage.value = 'Rewarded video loaded.'
    },
    onRewardFailed: (message) => {
      statusMessage.value = message ? `Rewarded video failed to load: ${message}` : 'Rewarded video failed to load.'
    },
    onRewardShowed: () => {
      statusMessage.value = 'Rewarded video shown.'
    },
    onRewardDismissed: () => {
      statusMessage.value = 'Rewarded video dismissed.'
    },
    onRewarded: async (reward) => {
      await creditRewardIfNeeded(reward)
    },
  })
}

onMounted(() => {
  void setupListeners()
})

onUnmounted(() => {
  void cleanupListeners.value?.()
})
</script>

<template>
  <section
    v-if="admob.canUseAdMob"
    class="admob-test-panel"
    aria-labelledby="admob-test-panel-title"
  >
    <div class="admob-test-panel__header">
      <div>
        <p class="admob-test-panel__eyebrow">Native Ads</p>
        <h2 id="admob-test-panel-title">AdMob test harness</h2>
      </div>
      <span class="admob-test-panel__badge">Test only</span>
    </div>

    <p class="admob-test-panel__copy">
      This panel uses Google test ad units only. It is safe for initial Android testing.
    </p>

    <div class="admob-test-panel__actions">
      <button
        type="button"
        class="admob-test-panel__button admob-test-panel__button--primary"
        :disabled="isBusy"
        @click="runAction(admob.showBanner, 'Banner ad requested.')"
      >
        Show Banner
      </button>
      <button
        type="button"
        class="admob-test-panel__button"
        :disabled="isBusy"
        @click="runAction(admob.hideBanner, 'Banner hidden.')"
      >
        Hide Banner
      </button>
      <button
        type="button"
        class="admob-test-panel__button"
        :disabled="isBusy"
        @click="runAction(admob.showInterstitial, 'Interstitial requested.')"
      >
        Show Interstitial
      </button>
      <button
        type="button"
        class="admob-test-panel__button"
        :disabled="isBusy"
        @click="requestRewardedAd"
      >
        Show Rewarded
      </button>
    </div>

    <p class="admob-test-panel__status">
      {{ statusMessage }}
    </p>
  </section>
</template>

<style scoped>
.admob-test-panel {
  margin-top: 1.2rem;
  padding: 1rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.22);
  backdrop-filter: blur(16px);
}

.admob-test-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.admob-test-panel__eyebrow {
  margin: 0;
  color: #d4af37;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.admob-test-panel h2 {
  margin: 0.35rem 0 0;
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 800;
}

.admob-test-panel__badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 204, 21, 0.18);
  background: rgba(250, 204, 21, 0.08);
  color: #fde68a;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admob-test-panel__copy {
  margin: 0.8rem 0 0;
  color: rgba(226, 232, 240, 0.8);
  font-size: 0.92rem;
  line-height: 1.5;
}

.admob-test-panel__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.95rem;
}

.admob-test-panel__button {
  min-height: 2.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #f8fafc;
  font-size: 0.88rem;
  font-weight: 700;
  transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;
}

.admob-test-panel__button:hover:not(:disabled),
.admob-test-panel__button:focus-visible:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(212, 175, 55, 0.22);
}

.admob-test-panel__button--primary {
  background: linear-gradient(145deg, #f5c542, #d4af37);
  color: #111827;
  border-color: transparent;
}

.admob-test-panel__button--primary:hover:not(:disabled),
.admob-test-panel__button--primary:focus-visible:not(:disabled) {
  background: linear-gradient(145deg, #ffd45a, #e3bf45);
}

.admob-test-panel__status {
  margin: 0.8rem 0 0;
  color: rgba(148, 163, 184, 0.88);
  font-size: 0.78rem;
}

@media (max-width: 640px) {
  .admob-test-panel__actions {
    grid-template-columns: 1fr;
  }
}
</style>
