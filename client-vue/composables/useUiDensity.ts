export type UiDensityMode = 'compact' | 'cozy'

const STORAGE_KEY = 'sevens-ui-density'
const MOBILE_BREAKPOINT = '(max-width: 640px)'

function isMobileUserAgent(userAgent = '') {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
}

function readStoredDensity(): UiDensityMode | null {
  if (import.meta.server) return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw === 'cozy' || raw === 'compact') return raw
  } catch {}

  return null
}

function writeStoredDensity(mode: UiDensityMode) {
  if (import.meta.server) return

  try {
    sessionStorage.setItem(STORAGE_KEY, mode)
  } catch {}
}

function resolveViewportDensity(): UiDensityMode {
  if (import.meta.client) {
    return window.matchMedia(MOBILE_BREAKPOINT).matches ? 'compact' : 'cozy'
  }

  const headers = useRequestHeaders(['user-agent'])
  return isMobileUserAgent(headers['user-agent'] || '') ? 'compact' : 'cozy'
}

function resolveAndroidDensity(configuredDensity?: string): UiDensityMode {
  return configuredDensity === 'cozy' ? 'cozy' : 'compact'
}

function resolveInitialDensity(isWebApp: boolean, configuredDensity?: string) {
  if (!isWebApp) return resolveAndroidDensity(configuredDensity)
  const storedDensity = readStoredDensity()
  return storedDensity ?? resolveViewportDensity()
}

export function useUiDensity() {
  const config = useRuntimeConfig()
  const { isWebApp } = useAppSource()
  const density = useState<UiDensityMode>(
    'ui-density',
    () => resolveInitialDensity(isWebApp.value, config.public.uiDensity),
  )
  const isCompact = computed(() => density.value === 'compact')

  function setDensity(mode: UiDensityMode) {
    density.value = mode
  }

  onMounted(() => {
    if (!isWebApp.value) return

    const storedDensity = readStoredDensity()
    const nextDensity = storedDensity ?? resolveViewportDensity()

    if (nextDensity !== density.value) {
      density.value = nextDensity
    }
  })

  watch(density, (mode) => {
    if (!import.meta.client || !isWebApp.value) return
    writeStoredDensity(mode)
  })

  return {
    layout: density,
    density,
    isCompact,
    setDensity,
  }
}
