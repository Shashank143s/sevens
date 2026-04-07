export default defineNuxtPlugin(() => {
  const { initAudioUnlock } = useSoundEffects()
  initAudioUnlock()
})
