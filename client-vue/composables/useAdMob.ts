import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  type AdMobRewardItem,
} from '@capacitor-community/admob'
import { useAppSource } from '~/composables/useAppSource'

const GOOGLE_TEST_BANNER_AD_ID = 'ca-app-pub-3940256099942544/6300978111'
const GOOGLE_TEST_INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173712'
const GOOGLE_TEST_REWARDED_AD_ID = 'ca-app-pub-3940256099942544/5224354917'

let initPromise: Promise<boolean> | null = null
let bannerVisible = false

type AdMobRuntimeFlags = {
  admobEnabled?: string
  admobTestMode?: string
  admobBannerAdUnitId?: string
  admobInterstitialAdUnitId?: string
  admobRewardedAdUnitId?: string
}

type AdMobEventHandlers = {
  onBannerLoaded?: () => void
  onBannerFailed?: (message?: string) => void
  onBannerOpened?: () => void
  onBannerClosed?: () => void
  onInterstitialLoaded?: () => void
  onInterstitialFailed?: (message?: string) => void
  onInterstitialShowed?: () => void
  onInterstitialDismissed?: () => void
  onRewardLoaded?: () => void
  onRewardFailed?: (message?: string) => void
  onRewardShowed?: () => void
  onRewardDismissed?: () => void
  onRewarded?: (reward: AdMobRewardItem) => void
}

function useAdMobFlags() {
  const runtimeConfig = useRuntimeConfig()
  return runtimeConfig.public as typeof runtimeConfig.public & AdMobRuntimeFlags
}

function isTruthy(value: unknown, fallback = false) {
  if (value == null) return fallback
  return !['false', '0', 'no', 'off'].includes(String(value).trim().toLowerCase())
}

function resolveAdId(explicitId: string | undefined, fallbackId: string) {
  const trimmed = explicitId?.trim()
  return trimmed || fallbackId
}

function readRuntimeAdId(value: unknown) {
  const trimmed = String(value ?? '').trim()
  return trimmed || undefined
}

async function initializeAdMob(): Promise<boolean> {
  if (!import.meta.client) return false
  if (Capacitor.getPlatform() !== 'android') return false

  const flags = useAdMobFlags()
  if (!isTruthy(flags.admobEnabled, true)) return false

  if (!initPromise) {
    initPromise = (async () => {
      await AdMob.initialize()
      return true
    })().catch((error) => {
      console.error('[admob] Failed to initialize AdMob:', error)
      return false
    })
  }

  return initPromise
}

export function useAdMob() {
  const flags = useAdMobFlags()
  const { isAndroidApp } = useAppSource()

  const canUseAdMob = computed(() => import.meta.client
    && isAndroidApp.value
    && Capacitor.getPlatform() === 'android'
    && isTruthy(flags.admobEnabled, true))

  const isTestMode = computed(() => isTruthy(flags.admobTestMode, true))

  const bannerAdId = computed(() => resolveAdId(readRuntimeAdId(flags.admobBannerAdUnitId), GOOGLE_TEST_BANNER_AD_ID))
  const interstitialAdId = computed(() => resolveAdId(readRuntimeAdId(flags.admobInterstitialAdUnitId), GOOGLE_TEST_INTERSTITIAL_AD_ID))
  const rewardedAdId = computed(() => resolveAdId(readRuntimeAdId(flags.admobRewardedAdUnitId), GOOGLE_TEST_REWARDED_AD_ID))

  async function ensureReady() {
    return initializeAdMob()
  }

  async function showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER) {
    if (!(await ensureReady())) return false
    if (bannerVisible) {
      await AdMob.removeBanner().catch(() => {})
      bannerVisible = false
    }

    await AdMob.showBanner({
      adId: bannerAdId.value,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position,
      margin: 0,
      isTesting: isTestMode.value,
      npa: true,
    })

    bannerVisible = true
    return true
  }

  async function hideBanner() {
    if (!bannerVisible) return false
    if (!(await ensureReady())) return false
    await AdMob.hideBanner()
    bannerVisible = false
    return true
  }

  async function removeBanner() {
    if (!bannerVisible) return false
    if (!(await ensureReady())) return false
    await AdMob.removeBanner()
    bannerVisible = false
    return true
  }

  async function showInterstitial() {
    if (!(await ensureReady())) return false

    await AdMob.prepareInterstitial({
      adId: interstitialAdId.value,
      isTesting: isTestMode.value,
      npa: true,
      immersiveMode: true,
    })
    await AdMob.showInterstitial()
    return true
  }

  async function showRewarded(): Promise<AdMobRewardItem | null> {
    if (!(await ensureReady())) return null

    await AdMob.prepareRewardVideoAd({
      adId: rewardedAdId.value,
      isTesting: isTestMode.value,
      npa: true,
      immersiveMode: true,
    })
    return AdMob.showRewardVideoAd()
  }

  async function registerEventListeners(handlers: AdMobEventHandlers = {}) {
    if (!(await ensureReady())) return () => Promise.resolve()

    const listeners: Array<{ remove: () => Promise<void> }> = []

    if (handlers.onBannerLoaded) {
      listeners.push(await AdMob.addListener(BannerAdPluginEvents.Loaded, handlers.onBannerLoaded))
    }
    if (handlers.onBannerFailed) {
      listeners.push(await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
        handlers.onBannerFailed?.(error.message)
      }))
    }
    if (handlers.onBannerOpened) {
      listeners.push(await AdMob.addListener(BannerAdPluginEvents.Opened, handlers.onBannerOpened))
    }
    if (handlers.onBannerClosed) {
      listeners.push(await AdMob.addListener(BannerAdPluginEvents.Closed, handlers.onBannerClosed))
    }

    if (handlers.onInterstitialLoaded) {
      listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.Loaded, handlers.onInterstitialLoaded))
    }
    if (handlers.onInterstitialFailed) {
      listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
        handlers.onInterstitialFailed?.(error.message)
      }))
    }
    if (handlers.onInterstitialShowed) {
      listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.Showed, handlers.onInterstitialShowed))
    }
    if (handlers.onInterstitialDismissed) {
      listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, handlers.onInterstitialDismissed))
    }

    if (handlers.onRewardLoaded) {
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Loaded, handlers.onRewardLoaded))
    }
    if (handlers.onRewardFailed) {
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
        handlers.onRewardFailed?.(error.message)
      }))
    }
    if (handlers.onRewardShowed) {
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Showed, handlers.onRewardShowed))
    }
    if (handlers.onRewardDismissed) {
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, handlers.onRewardDismissed))
    }
    if (handlers.onRewarded) {
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, handlers.onRewarded))
    }

    return async () => {
      await Promise.all(listeners.map((listener) => listener.remove().catch(() => {})))
    }
  }

  return {
    canUseAdMob,
    ensureReady,
    registerEventListeners,
    showBanner,
    hideBanner,
    removeBanner,
    showInterstitial,
    showRewarded,
  }
}
