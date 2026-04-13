type AppSource = 'web' | 'android'

function normalizeAppSource(value: unknown): AppSource {
  const normalized = String(value ?? 'web').trim().toLowerCase()
  return normalized === 'android' ? 'android' : 'web'
}

export function useAppSource() {
  const config = useRuntimeConfig()

  const appSource = computed<AppSource>(() => normalizeAppSource(config.public.appSource))
  const isWebApp = computed(() => appSource.value === 'web')
  const isAndroidApp = computed(() => appSource.value === 'android')

  return {
    appSource,
    isAndroidApp,
    isWebApp,
  }
}
