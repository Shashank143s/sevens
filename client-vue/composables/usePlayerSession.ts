const STORAGE_KEY = 'sevens-player-session'

export interface PlayerSession {
  id?: string
  name: string
  avatar: string
  image?: string
  email?: string
  lastLoginAt?: number
}

function loadFromStorage(): PlayerSession | null {
  if (import.meta.server) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PlayerSession
    return data.name?.trim() ? data : null
  } catch {
    return null
  }
}

function saveToStorage(session: PlayerSession | null) {
  if (import.meta.server) return
  try {
    if (session?.name?.trim()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}

export function usePlayerSession() {
  const session = useState<PlayerSession | null>('player-session', () => loadFromStorage())

  function setSession(sessionData: PlayerSession) {
    const next: PlayerSession = {
      ...sessionData,
      name: sessionData.name.trim(),
    }
    session.value = next
    saveToStorage(next)
  }

  function clearSession() {
    session.value = null
    saveToStorage(null)
  }

  // Rehydrate from storage when client mounts (e.g. after nav)
  onMounted(() => {
    const stored = loadFromStorage()
    if (stored && !session.value) session.value = stored
  })

  return { session: readonly(session), setSession, clearSession }
}
