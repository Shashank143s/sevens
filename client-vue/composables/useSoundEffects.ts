type SoundOptions = {
  volume?: number
  preload?: 'auto' | 'metadata' | 'none'
  loop?: boolean
}

const audioRegistry = new Map<string, HTMLAudioElement>()
const pendingPlayback = new Map<string, SoundOptions | undefined>()
let unlockInitialized = false
let audioUnlocked = false

const SILENT_AUDIO_DATA_URI = 'data:audio/mp3;base64,SUQzAwAAAAAAF1RTU0UAAAAPAAADTGF2ZjU4LjMyLjEwNAAAAAAAAAAAAAAA//tQxAADBQAKGAAABAAADSAAAAEAAACiY2QxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEx//sQxAADwAABpAAAAgAAA0gAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

function canUseAudio() {
  return import.meta.client && typeof window !== 'undefined' && typeof Audio !== 'undefined'
}

function getAudio(src: string, options?: SoundOptions) {
  if (!canUseAudio()) return null

  let audio = audioRegistry.get(src)
  if (!audio) {
    audio = new Audio(src)
    audio.preload = options?.preload ?? 'auto'
    audio.playsInline = true
    if (typeof options?.volume === 'number') {
      audio.volume = options.volume
    }
    if (typeof options?.loop === 'boolean') {
      audio.loop = options.loop
    }
    audioRegistry.set(src, audio)
  } else {
    if (typeof options?.volume === 'number') {
      audio.volume = options.volume
    }
    if (typeof options?.loop === 'boolean') {
      audio.loop = options.loop
    }
  }

  return audio
}

async function warmRegisteredAudio() {
  if (!canUseAudio()) return

  for (const audio of audioRegistry.values()) {
    try {
      const previousMuted = audio.muted
      const previousTime = audio.currentTime
      audio.muted = true
      audio.currentTime = 0
      await audio.play()
      audio.pause()
      audio.currentTime = previousTime
      audio.muted = previousMuted
    } catch {
      // Ignore warm-up failures for individual files.
    }
  }
}

async function flushPendingPlayback() {
  if (!canUseAudio() || !audioUnlocked || pendingPlayback.size === 0) return

  const queued = Array.from(pendingPlayback.entries())
  pendingPlayback.clear()

  for (const [src, options] of queued) {
    const audio = getAudio(src, options)
    if (!audio) continue

    try {
      audio.currentTime = 0
      await audio.play()
    } catch {
      pendingPlayback.set(src, options)
    }
  }
}

async function unlockAudioPlayback() {
  if (!canUseAudio() || audioUnlocked) return

  try {
    const probe = new Audio(SILENT_AUDIO_DATA_URI)
    probe.muted = true
    probe.playsInline = true
    probe.preload = 'auto'
    await probe.play()
    probe.pause()
    probe.currentTime = 0
  } catch {
    // Ignore unlock failures; we'll retry on the next user gesture.
    return
  }

  audioUnlocked = true
  await warmRegisteredAudio()
  await flushPendingPlayback()
}

export function useSoundEffects() {
  function initAudioUnlock() {
    if (!canUseAudio() || unlockInitialized) return
    unlockInitialized = true

    const unlock = async () => {
      await unlockAudioPlayback()
      if (!audioUnlocked) return

      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchend', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('click', unlock)
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('touchend', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
    window.addEventListener('click', unlock, { passive: true })
  }

  function registerSound(src: string, options?: SoundOptions) {
    initAudioUnlock()
    return getAudio(src, options)
  }

  async function playSound(src: string, options?: SoundOptions) {
    const audio = registerSound(src, options)
    if (!audio) return false

    try {
      audio.currentTime = 0
      await audio.play()
      pendingPlayback.delete(src)
      return true
    } catch {
      pendingPlayback.set(src, options)
      return false
    }
  }

  function stopSound(src: string) {
    const audio = audioRegistry.get(src)
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    pendingPlayback.delete(src)
  }

  return {
    initAudioUnlock,
    registerSound,
    playSound,
    stopSound,
  }
}
