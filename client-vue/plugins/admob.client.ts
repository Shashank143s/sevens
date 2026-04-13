import { useAdMob } from '~/composables/useAdMob'

export default defineNuxtPlugin(() => {
  const { canUseAdMob, ensureReady } = useAdMob()

  if (!canUseAdMob.value) return

  void ensureReady()
})
