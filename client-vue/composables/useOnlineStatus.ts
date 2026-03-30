export function useOnlineStatus() {
  const isOnline = useState<boolean>('network-online', () => true)

  function syncOnlineState() {
    if (!import.meta.client) return
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    if (!import.meta.client) return
    syncOnlineState()
    window.addEventListener('online', syncOnlineState)
    window.addEventListener('offline', syncOnlineState)
  })

  onUnmounted(() => {
    if (!import.meta.client) return
    window.removeEventListener('online', syncOnlineState)
    window.removeEventListener('offline', syncOnlineState)
  })

  return {
    isOnline: readonly(isOnline),
    syncOnlineState,
  }
}
