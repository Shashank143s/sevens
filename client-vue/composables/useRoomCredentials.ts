const STORAGE_KEY = 'sevens-room-credentials'

export interface RoomCredentials {
  playerID?: string
  credentials?: string
  roomPassword?: string
  roomName?: string
  creatorOwned?: boolean
}

function loadAll(): Record<string, RoomCredentials> {
  if (import.meta.server) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, RoomCredentials>
  } catch {
    return {}
  }
}

function saveAll(data: Record<string, RoomCredentials>) {
  if (import.meta.server) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function useRoomCredentials() {
  function getCredentials(matchID: string): RoomCredentials | null {
    const all = loadAll()
    const entry = all[matchID]
    if (!entry?.playerID || !entry?.credentials) return null
    return entry
  }

  function setCredentials(matchID: string, creds: RoomCredentials) {
    const all = loadAll()
    all[matchID] = {
      ...all[matchID],
      ...creds,
    }
    saveAll(all)
  }

  function getRoomMeta(matchID: string): RoomCredentials | null {
    const all = loadAll()
    return all[matchID] ?? null
  }

  function setRoomMeta(matchID: string, meta: RoomCredentials) {
    const all = loadAll()
    all[matchID] = {
      ...all[matchID],
      ...meta,
    }
    saveAll(all)
  }

  function clearCredentials(matchID: string) {
    const all = loadAll()
    const existing = all[matchID]
    if (!existing) return
    if (existing.roomPassword || existing.roomName || existing.creatorOwned) {
      all[matchID] = {
        roomPassword: existing.roomPassword,
        roomName: existing.roomName,
        creatorOwned: existing.creatorOwned,
      }
    } else {
      delete all[matchID]
    }
    saveAll(all)
  }

  function clearAllCredentials() {
    saveAll({})
  }

  return { getCredentials, setCredentials, getRoomMeta, setRoomMeta, clearCredentials, clearAllCredentials }
}
