export type UiDensityMode = 'compact' | 'cozy'

export function useUiDensity() {
  const config = useRuntimeConfig()

  const density = computed<UiDensityMode>(() => (
    config.public.uiDensity === 'cozy' ? 'cozy' : 'compact'
  ))
  const isCompact = computed(() => density.value === 'compact')

  useHead(() => ({
    htmlAttrs: {
      class: density.value === 'compact' ? 'ui-density-compact' : 'ui-density-cozy',
    },
  }))

  function applyDensityClass(mode: UiDensityMode) {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove('ui-density-compact', 'ui-density-cozy')
    root.classList.add(mode === 'compact' ? 'ui-density-compact' : 'ui-density-cozy')
  }

  onMounted(() => {
    applyDensityClass(density.value)
  })

  watch(density, (mode) => {
    applyDensityClass(mode)
  })

  return {
    density,
    isCompact,
  }
}
