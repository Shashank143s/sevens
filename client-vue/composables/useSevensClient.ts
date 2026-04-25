import { Client } from 'boardgame.io/client'
import { SocketIO } from 'boardgame.io/multiplayer'
import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { io as createSocket } from 'socket.io-client'
import { Sevens } from '@server/game'
import type { Card, Suit } from '@shared/types'
import { useRuntimeConfig } from 'nuxt/app'

export interface GameState {
  G: {
    piles: Record<Suit, { low: number | null; high: number | null }>
    hands: Card[][]
    passedPlayers: number[]
    firstPlayer: number
    playedCards?: Card[]
  }
  ctx: { currentPlayer: string; gameover?: { winner?: number } }
  moves: Record<string, (...args: unknown[]) => void>
  playerID: string | null
  isActive?: boolean
  isConnected?: boolean
}

export function useSevensClient(
  matchID: string,
  playerId: string = '0',
  credentials?: string,
) {
  const state: Ref<GameState | null> = ref(null)

  const config = useRuntimeConfig()
  const socketServer = config.public.socketServer as string
  const socket = createSocket(`${socketServer.replace(/\/$/, '')}/sevens`, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
  })

  const client = Client({
    game: Sevens,
    multiplayer: SocketIO({ server: socketServer, socket }),
    debug: false,
    matchID,
    playerID: playerId,
    credentials,
  })

  const unsubscribe = client.subscribe((s) => {
    if (s) {
      state.value = {
        G: s.G as GameState['G'],
        ctx: s.ctx,
        moves: client.moves as Record<string, (...args: unknown[]) => void>,
        playerID: client.playerID ?? null,
        isActive: s.isActive,
        isConnected: s.isConnected,
      }
    }
  })

  client.start()
  socket.connect()

  onUnmounted(() => {
    unsubscribe()
    client.stop()
    socket.close()
  })

  return { state, client }
}
