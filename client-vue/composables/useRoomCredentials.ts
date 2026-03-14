const STORAGE_KEY = 'sevens-room-credentials'

export interface RoomCredentials {
  playerID: string
  credentials: string
}

function loadAll(): Record<string, RoomCredentials> {
  if (import.meta.server) return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, RoomCredentials>
  } catch {
    return {}
  }
}

function saveAll(data: Record<string, RoomCredentials>) {
  if (import.meta.server) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function useRoomCredentials() {
  function getCredentials(matchID: string): RoomCredentials | null {
    const all = loadAll()
    return all[matchID] ?? null
  }

  function setCredentials(matchID: string, creds: RoomCredentials) {
    const all = loadAll()
    all[matchID] = creds
    saveAll(all)
  }

  function clearCredentials(matchID: string) {
    const all = loadAll()
    delete all[matchID]
    saveAll(all)
  }

  function clearAllCredentials() {
    saveAll({})
  }

  return { getCredentials, setCredentials, clearCredentials, clearAllCredentials }
}
