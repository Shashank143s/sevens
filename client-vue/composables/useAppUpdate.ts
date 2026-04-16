import { Capacitor, registerPlugin } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'

type AppVersionPolicyResponse = {
  platform: string
  latest_version_code: number
  min_supported_version_code: number
  update_mode: 'flexible' | 'immediate'
  message?: string
}

type NativeVersionInfo = {
  versionCode: number
  versionName: string
}

type NativeUpdateInfo = {
  supported: boolean
  updateAvailable: boolean
  availableVersionCode: number
  updatePriority: number
  immediateAllowed: boolean
  flexibleAllowed: boolean
  installStatus: string
}

type NativeStartUpdateResult = {
  started: boolean
  updateAvailable?: boolean
  allowed?: boolean
}

type NativeAppUpdateStateEvent = {
  status: string
  bytesDownloaded?: number
  totalBytesToDownload?: number
  installErrorCode?: number
}

type NativeAppUpdateFlowResultEvent = {
  status: 'accepted' | 'canceled' | 'failed'
  resultCode?: number
}

type NativeAppUpdatePlugin = {
  getCurrentAppVersion: () => Promise<NativeVersionInfo>
  checkForUpdate: () => Promise<NativeUpdateInfo>
  startImmediateUpdate: () => Promise<NativeStartUpdateResult>
  startFlexibleUpdate: () => Promise<NativeStartUpdateResult>
  completeFlexibleUpdate: () => Promise<{ completed: boolean }>
  openPlayStoreListing: () => Promise<void>
  addListener(
    eventName: 'appUpdateStateChanged',
    listener: (event: NativeAppUpdateStateEvent) => void,
  ): Promise<PluginListenerHandle>
  addListener(
    eventName: 'appUpdateFlowResult',
    listener: (event: NativeAppUpdateFlowResultEvent) => void,
  ): Promise<PluginListenerHandle>
}

const AppUpdate = registerPlugin<NativeAppUpdatePlugin>('AppUpdate')

function toVersionCode(value: unknown) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.trunc(n))
}

export function useAppUpdate() {
  const config = useRuntimeConfig()
  const { isAndroidApp } = useAppSource()

  const checkedOnLaunch = useState<boolean>('app-update-checked-on-launch', () => false)
  const checking = useState<boolean>('app-update-checking', () => false)
  const modalVisible = useState<boolean>('app-update-modal-visible', () => false)
  const mandatory = useState<boolean>('app-update-mandatory', () => false)
  const flowInProgress = useState<boolean>('app-update-flow-in-progress', () => false)
  const updateDownloaded = useState<boolean>('app-update-downloaded', () => false)
  const currentVersionCode = useState<number>('app-update-current-version-code', () => 0)
  const availableVersionCode = useState<number>('app-update-available-version-code', () => 0)
  const statusMessage = useState<string | null>('app-update-status-message', () => null)
  const policy = useState<AppVersionPolicyResponse | null>('app-update-policy', () => null)
  const playInfo = useState<NativeUpdateInfo | null>('app-update-play-info', () => null)
  const stateListenerAttached = useState<boolean>('app-update-listeners-attached', () => false)

  const isSupportedPlatform = computed(() => isAndroidApp.value && Capacitor.isNativePlatform())
  const hasPolicyUpdate = computed(() => {
    if (!policy.value) return false
    return currentVersionCode.value < toVersionCode(policy.value.latest_version_code)
  })

  const updateCopy = computed(() => {
    if (policy.value?.message?.trim()) return policy.value.message.trim()
    if (mandatory.value) return 'A critical update is required to continue playing.'
    return 'A newer version is available with improvements and fixes.'
  })

  async function fetchVersionPolicy() {
    const response = await $fetch<AppVersionPolicyResponse>(`${config.public.apiBase}/api/app/version-policy`, {
      query: { platform: 'android' },
    })
    policy.value = response
    return response
  }

  async function refreshCurrentVersion() {
    const info = await AppUpdate.getCurrentAppVersion()
    currentVersionCode.value = toVersionCode(info.versionCode)
    return info
  }

  async function refreshPlayInfo() {
    const info = await AppUpdate.checkForUpdate()
    playInfo.value = info
    availableVersionCode.value = toVersionCode(info.availableVersionCode)
    updateDownloaded.value = info.installStatus === 'downloaded'
    return info
  }

  function evaluatePromptVisibility() {
    if (!policy.value) {
      modalVisible.value = false
      mandatory.value = false
      return
    }

    const latestVersion = toVersionCode(policy.value.latest_version_code)
    const minSupported = toVersionCode(policy.value.min_supported_version_code)
    const currentVersion = toVersionCode(currentVersionCode.value)

    mandatory.value = currentVersion < minSupported

    const optionalUpdateAvailable = currentVersion < latestVersion
    modalVisible.value = mandatory.value || optionalUpdateAvailable

    if (!modalVisible.value) {
      statusMessage.value = null
      updateDownloaded.value = false
    }
  }

  async function checkForUpdatesOnLaunch(force = false) {
    if (!isSupportedPlatform.value) return
    if (checkedOnLaunch.value && !force) return

    checking.value = true
    statusMessage.value = null
    checkedOnLaunch.value = true

    try {
      await Promise.all([
        fetchVersionPolicy(),
        refreshCurrentVersion(),
      ])
      await refreshPlayInfo()
      evaluatePromptVisibility()
    } catch (error) {
      console.error('[app-update] launch check failed:', error)
    } finally {
      checking.value = false
    }
  }

  async function openStoreListingFallback() {
    try {
      await AppUpdate.openPlayStoreListing()
    } catch (error) {
      console.error('[app-update] open store listing failed:', error)
      statusMessage.value = 'Unable to open the Play Store right now. Please update manually.'
    }
  }

  async function startUpdate() {
    if (!isSupportedPlatform.value || flowInProgress.value) return
    flowInProgress.value = true
    statusMessage.value = null

    try {
      if (updateDownloaded.value && !mandatory.value) {
        await AppUpdate.completeFlexibleUpdate()
        return
      }

      const policyMode = policy.value?.update_mode === 'immediate' ? 'immediate' : 'flexible'
      const forceImmediate = mandatory.value || policyMode === 'immediate'
      const info = playInfo.value ?? await refreshPlayInfo()

      const canImmediate = info.immediateAllowed
      const canFlexible = info.flexibleAllowed

      if (forceImmediate) {
        if (canImmediate) {
          const result = await AppUpdate.startImmediateUpdate()
          if (!result.started) await openStoreListingFallback()
        } else {
          await openStoreListingFallback()
        }
        return
      }

      if (canFlexible) {
        const result = await AppUpdate.startFlexibleUpdate()
        if (!result.started) await openStoreListingFallback()
      } else if (canImmediate) {
        const result = await AppUpdate.startImmediateUpdate()
        if (!result.started) await openStoreListingFallback()
      } else {
        await openStoreListingFallback()
      }
    } catch (error) {
      console.error('[app-update] failed to start update flow:', error)
      statusMessage.value = 'Unable to start update right now. Please try again.'
    } finally {
      flowInProgress.value = false
    }
  }

  function dismissOptionalUpdate() {
    if (mandatory.value) return
    modalVisible.value = false
    statusMessage.value = null
  }

  function handleUpdateStateChanged(event: NativeAppUpdateStateEvent) {
    if (event.status === 'downloaded') {
      updateDownloaded.value = true
      modalVisible.value = true
      statusMessage.value = 'Update downloaded. Tap restart to finish installation.'
      return
    }

    if (event.status === 'installed') {
      modalVisible.value = false
      updateDownloaded.value = false
      statusMessage.value = null
      return
    }

    if (event.status === 'failed') {
      statusMessage.value = 'Update failed. Please try again.'
      if (mandatory.value) modalVisible.value = true
    }
  }

  function handleUpdateFlowResult(event: NativeAppUpdateFlowResultEvent) {
    if (event.status === 'canceled') {
      if (mandatory.value) {
        modalVisible.value = true
        statusMessage.value = 'This update is required to continue.'
      }
      return
    }

    if (event.status === 'failed') {
      statusMessage.value = 'Update flow failed. Please try again.'
      if (mandatory.value) modalVisible.value = true
      return
    }

    if (event.status === 'accepted' && !mandatory.value) {
      statusMessage.value = null
    }
  }

  async function attachNativeListeners() {
    if (!isSupportedPlatform.value || stateListenerAttached.value) return

    try {
      await AppUpdate.addListener('appUpdateStateChanged', handleUpdateStateChanged)
      await AppUpdate.addListener('appUpdateFlowResult', handleUpdateFlowResult)
      stateListenerAttached.value = true
    } catch (error) {
      console.error('[app-update] failed to attach listeners:', error)
    }
  }

  onMounted(() => {
    void attachNativeListeners()
  })

  return {
    checking,
    modalVisible,
    mandatory,
    flowInProgress,
    updateDownloaded,
    currentVersionCode,
    availableVersionCode,
    statusMessage,
    hasPolicyUpdate,
    updateCopy,
    checkForUpdatesOnLaunch,
    startUpdate,
    dismissOptionalUpdate,
  }
}
