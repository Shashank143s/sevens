export function useAndroidViewportInsets() {
  const { isAndroidApp } = useAppSource()
  const topInsetPx = ref(0)
  const bottomInsetPx = ref(0)
  let onViewportChange: (() => void) | null = null

  function syncViewportInsets() {
    if (typeof window === 'undefined' || !isAndroidApp.value) {
      topInsetPx.value = 0
      bottomInsetPx.value = 0
      return
    }

    const vv = window.visualViewport
    if (!vv) {
      topInsetPx.value = 0
      bottomInsetPx.value = 0
      return
    }

    topInsetPx.value = Math.max(0, Math.round(vv.offsetTop))
    bottomInsetPx.value = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
  }

  onMounted(() => {
    syncViewportInsets()
    onViewportChange = () => syncViewportInsets()
    window.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('scroll', onViewportChange)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined' || !onViewportChange) return
    window.removeEventListener('resize', onViewportChange)
    window.visualViewport?.removeEventListener('resize', onViewportChange)
    window.visualViewport?.removeEventListener('scroll', onViewportChange)
  })

  const topInsetCss = computed(() => (
    isAndroidApp.value
      ? `calc(env(safe-area-inset-top) + ${topInsetPx.value}px)`
      : 'env(safe-area-inset-top)'
  ))

  const bottomInsetCss = computed(() => (
    isAndroidApp.value
      ? `calc(env(safe-area-inset-bottom) + ${bottomInsetPx.value}px)`
      : 'env(safe-area-inset-bottom)'
  ))

  return {
    topInsetPx,
    bottomInsetPx,
    topInsetCss,
    bottomInsetCss,
    syncViewportInsets,
  }
}
