import { Client } from 'boardgame.io/client'
import { SocketIO } from 'boardgame.io/multiplayer'
import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { Sevens } from '@server/game'

export interface GameState {
  G: {
    piles: Record<string, { low: number; high: number }>
    hands: unknown[][]
    playedCards: unknown[]
  }
  ctx: { currentPlayer: string }
  moves: Record<string, (...args: unknown[]) => void>
  playerID: string | null
  isActive?: boolean
  isConnected?: boolean
}

export function useSevensClient(matchID: string, playerID: string = '0') {
  const state: Ref<GameState | null> = ref(null)

  const client = Client({
    game: Sevens,
    multiplayer: SocketIO({ server: 'http://localhost:8000' }),
    debug: false,
  })

  client.start({ matchID, playerID })

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

  onUnmounted(() => {
    unsubscribe()
    client.stop()
  })

  return { state, client }
}
