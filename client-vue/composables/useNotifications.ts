const NOTIFICATION_PREF_KEY = 'sevens-notifications-enabled'

type NotificationPermissionState = NotificationPermission | 'unsupported'

function readNotificationPreference(): boolean {
  if (import.meta.server) return false
  try {
    return localStorage.getItem(NOTIFICATION_PREF_KEY) === 'true'
  } catch {
    return false
  }
}

function writeNotificationPreference(enabled: boolean) {
  if (import.meta.server) return
  try {
    localStorage.setItem(NOTIFICATION_PREF_KEY, enabled ? 'true' : 'false')
  } catch {}
}

export function useNotifications() {
  const notificationsEnabled = useState<boolean>('notifications-enabled', () => readNotificationPreference())
  const permission = useState<NotificationPermissionState>('notifications-permission', () => {
    if (import.meta.server) return 'unsupported'
    return 'Notification' in window ? Notification.permission : 'unsupported'
  })

  const isSupported = computed(() => permission.value !== 'unsupported')
  const isGranted = computed(() => permission.value === 'granted')
  const canRequest = computed(() => permission.value === 'default')
  const statusLabel = computed(() => {
    if (!isSupported.value) return 'Notifications unavailable on this device'
    if (permission.value === 'granted') return 'Browser notifications enabled'
    if (permission.value === 'denied') return 'Notifications blocked in browser settings'
    return 'Enable browser notifications for future turn alerts'
  })

  async function refreshPermission() {
    if (!import.meta.client) return
    permission.value = 'Notification' in window ? Notification.permission : 'unsupported'
    if (permission.value !== 'granted') {
      notificationsEnabled.value = false
      writeNotificationPreference(false)
    }
  }

  async function requestPermission() {
    if (!import.meta.client || !('Notification' in window)) return false
    const nextPermission = await Notification.requestPermission()
    permission.value = nextPermission
    const enabled = nextPermission === 'granted'
    notificationsEnabled.value = enabled
    writeNotificationPreference(enabled)

    if (enabled && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration?.showNotification('Sevens Royale alerts enabled', {
        body: 'You will be ready for turn reminders once push delivery is connected.',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        tag: 'sevens-notifications-enabled',
      }).catch(() => {})
    }

    return enabled
  }

  function disableNotifications() {
    notificationsEnabled.value = false
    writeNotificationPreference(false)
  }

  onMounted(() => {
    refreshPermission()
  })

  return {
    notificationsEnabled: readonly(notificationsEnabled),
    permission: readonly(permission),
    isSupported,
    isGranted,
    canRequest,
    statusLabel,
    refreshPermission,
    requestPermission,
    disableNotifications,
  }
}
