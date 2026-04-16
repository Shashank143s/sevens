import { Capacitor, registerPlugin } from '@capacitor/core'
import { useAppSource } from '~/composables/useAppSource'

type NativeNotificationStatus = {
  granted: boolean
  supported: boolean
  canRequest: boolean
}

type NativeNotificationPermissionPlugin = {
  getStatus: () => Promise<NativeNotificationStatus>
  requestPermission: () => Promise<NativeNotificationStatus>
  openSettings: () => Promise<void>
}

const NotificationPermission = registerPlugin<NativeNotificationPermissionPlugin>('NotificationPermission')

export function useNotificationPermission() {
  const { isAndroidApp } = useAppSource()
  const webNotifications = useNotifications()
  const nativeGranted = useState<boolean>('native-notification-granted', () => false)
  const nativeSupported = useState<boolean>('native-notification-supported', () => false)

  const isSupported = computed(() => (
    isAndroidApp.value
      ? nativeSupported.value || Capacitor.isNativePlatform()
      : webNotifications.isSupported.value
  ))

  const isGranted = computed(() => (
    isAndroidApp.value
      ? nativeGranted.value
      : webNotifications.isGranted.value
  ))

  const notificationsEnabled = computed(() => (
    isAndroidApp.value
      ? nativeGranted.value
      : webNotifications.notificationsEnabled.value
  ))

  const canRequest = computed(() => (
    isAndroidApp.value
      ? !nativeGranted.value
      : webNotifications.canRequest.value
  ))

  const statusLabel = computed(() => {
    if (isAndroidApp.value) {
      if (nativeGranted.value) return 'Android notifications enabled'
      return 'Enable Android notifications for live game alerts and reminders'
    }

    return webNotifications.statusLabel.value
  })

  async function refreshPermission() {
    if (isAndroidApp.value && Capacitor.isNativePlatform()) {
      try {
        const status = await NotificationPermission.getStatus()
        nativeGranted.value = !!status.granted
        nativeSupported.value = status.supported !== false
      } catch {
        nativeGranted.value = false
        nativeSupported.value = true
      }
      return
    }

    await webNotifications.refreshPermission()
  }

  async function requestPermission() {
    if (isAndroidApp.value && Capacitor.isNativePlatform()) {
      try {
        const status = await NotificationPermission.requestPermission()
        nativeGranted.value = !!status.granted
        nativeSupported.value = status.supported !== false
        return nativeGranted.value
      } catch {
        nativeGranted.value = false
        nativeSupported.value = true
        return false
      }
    }

    return await webNotifications.requestPermission()
  }

  async function openSystemSettings() {
    if (isAndroidApp.value && Capacitor.isNativePlatform()) {
      try {
        await NotificationPermission.openSettings()
      } catch {}
    }
  }

  function disableNotifications() {
    if (isAndroidApp.value) return
    webNotifications.disableNotifications()
  }

  onMounted(() => {
    void refreshPermission()
  })

  return {
    notificationsEnabled,
    isSupported,
    isGranted,
    canRequest,
    statusLabel,
    refreshPermission,
    requestPermission,
    openSystemSettings,
    disableNotifications,
  }
}
