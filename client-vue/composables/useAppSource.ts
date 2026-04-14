export function useAppSource() {
  const config = useRuntimeConfig()

  const appSource = computed(() => config.public.appSource || 'web')
  const isAndroidApp = computed(() => appSource.value === 'android')
  const isWebApp = computed(() => appSource.value === 'web')

  return {
    appSource,
    isAndroidApp,
    isWebApp,
  }
}
