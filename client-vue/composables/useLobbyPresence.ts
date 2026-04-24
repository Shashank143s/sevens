import { io, type Socket } from 'socket.io-client'
import type { Ref } from 'vue'
import type { LobbyPresenceJoinPayload, LobbyPresenceUser } from '@shared/types'

type LobbyPresenceSnapshot = {
  users?: LobbyPresenceUser[]
}

let socket: Socket | null = null
let socketServerUrl: string | null = null
let socketListenersBound = false
let browserListenersBound = false
let activeConsumers = 0
let sessionWatcherStop: (() => void) | null = null
let browserShutdownHandler: (() => void) | null = null
let currentPresenceSession: { id?: string; name?: string } | null = null
let pendingPresenceJoin: LobbyPresenceJoinPayload | null = null
let lobbyUsersState: Ref<LobbyPresenceUser[]> | null = null
let lobbyConnectedState: Ref<boolean> | null = null
let lobbyLastUpdatedAtState: Ref<number> | null = null

function ensurePresenceState() {
  if (!lobbyUsersState) {
    lobbyUsersState = useState<LobbyPresenceUser[]>('lobby-presence-users', () => [])
  }
  if (!lobbyConnectedState) {
    lobbyConnectedState = useState<boolean>('lobby-presence-connected', () => false)
  }
  if (!lobbyLastUpdatedAtState) {
    lobbyLastUpdatedAtState = useState<number>('lobby-presence-last-updated-at', () => 0)
  }

  return {
    lobbyUsers: lobbyUsersState,
    lobbyConnected: lobbyConnectedState,
    lobbyLastUpdatedAt: lobbyLastUpdatedAtState,
  }
}

function createSocket() {
  if (!socketServerUrl) return null
  if (socket) return socket
  socket = io(`${socketServerUrl.replace(/\/$/, '')}/lobby`, {
    autoConnect: false,
    transports: ['websocket'],
  })
  return socket
}

function applySnapshot(payload: LobbyPresenceSnapshot) {
  const presenceState = ensurePresenceState()
  presenceState.lobbyUsers.value = payload.users ?? []
  presenceState.lobbyLastUpdatedAt.value = Date.now()
}

function buildPresenceJoinPayload(session: { id?: string; name?: string } | null | undefined) {
  const userId = String(session?.id ?? '').trim()
  const name = String(session?.name ?? '').trim()
  if (!userId || !name) return null
  return { userId, name } satisfies LobbyPresenceJoinPayload
}

function emitPresenceJoin(session: { id?: string; name?: string } | null | undefined) {
  const presenceState = ensurePresenceState()
  currentPresenceSession = session ?? null

  const payload = buildPresenceJoinPayload(session)

  if (!payload) {
    pendingPresenceJoin = null
    if (socket) {
      socket.emit('presence:leave')
      socket.disconnect()
    }
    presenceState.lobbyConnected.value = false
    return
  }

  const activeSocket = createSocket()
  if (!activeSocket) return
  if (!socketListenersBound) {
    bindSocketListeners()
  }

  if (!socket.connected) {
    pendingPresenceJoin = payload
    socket.connect()
    return
  }

  socket.emit('presence:join', payload)
}

function bindSocketListeners() {
  if (!socket || socketListenersBound) return
  const presenceState = ensurePresenceState()

  socket.on('connect', () => {
    presenceState.lobbyConnected.value = true
    const payload = pendingPresenceJoin ?? buildPresenceJoinPayload(currentPresenceSession)
    pendingPresenceJoin = null
    if (payload) {
      socket.emit('presence:join', payload)
    }
  })

  socket.on('disconnect', () => {
    presenceState.lobbyConnected.value = false
  })

  socket.on('connect_error', () => {
    presenceState.lobbyConnected.value = false
  })

  socket.on('presence:snapshot', (payload: LobbyPresenceSnapshot) => {
    applySnapshot(payload)
  })

  socketListenersBound = true
}

function bindBrowserListeners() {
  if (browserListenersBound || !import.meta.client) return

  browserShutdownHandler = () => {
    if (!socket) return
    socket.emit('presence:leave')
    socket.disconnect()
    ensurePresenceState().lobbyConnected.value = false
  }

  window.addEventListener('pagehide', browserShutdownHandler)
  window.addEventListener('beforeunload', browserShutdownHandler)

  browserListenersBound = true
}

function unbindBrowserListeners() {
  if (!browserListenersBound || !import.meta.client || !browserShutdownHandler) return

  window.removeEventListener('pagehide', browserShutdownHandler)
  window.removeEventListener('beforeunload', browserShutdownHandler)
  browserShutdownHandler = null
  browserListenersBound = false
}

export function useLobbyPresence() {
  const config = useRuntimeConfig()
  const { session, hydrated } = usePlayerSession()
  const presenceState = ensurePresenceState()
  socketServerUrl = config.public.socketServer as string

  if (import.meta.client) {
    bindBrowserListeners()

    if (sessionWatcherStop == null) {
      sessionWatcherStop = watch(
        [hydrated, session],
        ([sessionHydrated, currentSession]) => {
          if (!sessionHydrated) return
          currentPresenceSession = currentSession ?? null
          emitPresenceJoin(currentSession)
        },
        { immediate: true, deep: true },
      )
    }

    activeConsumers += 1

    onUnmounted(() => {
      activeConsumers = Math.max(0, activeConsumers - 1)
      if (activeConsumers > 0) return

      sessionWatcherStop?.()
      sessionWatcherStop = null

      if (socket) {
        socket.emit('presence:leave')
        socket.disconnect()
        socket.removeAllListeners()
        socket = null
        socketListenersBound = false
        pendingPresenceJoin = null
      }
      socketServerUrl = null

      presenceState.lobbyConnected.value = false
      unbindBrowserListeners()
    })
  }

  return {
    onlineUsers: readonly(presenceState.lobbyUsers),
    onlineCount: computed(() => presenceState.lobbyUsers.value.length),
    isConnected: readonly(presenceState.lobbyConnected),
    lastUpdatedAt: readonly(presenceState.lobbyLastUpdatedAt),
  }
}

export function useLobbyPresenceState() {
  const presenceState = ensurePresenceState()
  return {
    onlineUsers: readonly(presenceState.lobbyUsers),
    onlineCount: computed(() => presenceState.lobbyUsers.value.length),
    isConnected: readonly(presenceState.lobbyConnected),
    lastUpdatedAt: readonly(presenceState.lobbyLastUpdatedAt),
  }
}
