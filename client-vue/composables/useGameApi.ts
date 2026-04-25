type CreateGameRecordPayload = {
  room_name: string
  room_size: number
  creator_user_id?: string
  coin_rules?: {
    stake?: number
  }
  access?: {
    is_private?: boolean
    password?: string
  }
  metadata?: {
    source?: 'web' | 'pwa' | 'apk'
    notes?: string
  }
}

type JoinMatchPayload = {
  playerName: string
  data: Record<string, unknown>
  password?: string
  user_id?: string
}

export function useGameApi() {
  const config = useRuntimeConfig()

  function buildGameUrl(matchID: string) {
    return `${config.public.apiBase}/api/game/${encodeURIComponent(matchID)}`
  }

  async function createGameRecord(matchID: string, payload: CreateGameRecordPayload) {
    try {
      return await $fetch(buildGameUrl(matchID), {
        method: 'POST',
        body: payload,
      })
    } catch (error: any) {
      throw new Error(error?.data?.error ?? 'Failed to create room record')
    }
  }

  async function getGameRecord(matchID: string) {
    return $fetch<GameRecordResponse>(buildGameUrl(matchID))
  }

  async function joinMatch(matchID: string, payload: JoinMatchPayload) {
    try {
      return await $fetch<JoinGameResponse>(`${buildGameUrl(matchID)}/join`, {
        method: 'POST',
        body: payload,
      })
    } catch (error: any) {
      throw new Error(error?.data?.error ?? 'Unable to join this room')
    }
  }

  async function markGameInProgress(matchID: string) {
    return $fetch(buildGameUrl(matchID), {
      method: 'PUT',
      body: {
        status: 'in_progress',
        started_at: new Date().toISOString(),
      },
    })
  }

  async function completeGameRecord(matchID: string, winnerPlayerID: string) {
    try {
      await $fetch(buildGameUrl(matchID), {
        method: 'DELETE',
        body: {
          status: 'completed',
          winner_seat_id: winnerPlayerID,
          ended_at: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      throw new Error(error?.data?.error ?? 'Failed to end room')
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const gameRecord = await getGameRecord(matchID)
        const settlementStatus = gameRecord.game?.coin_settlement?.status
        if (settlementStatus === 'completed' || settlementStatus === 'void') {
          return gameRecord
        }
        if (attempt === 7) {
          return gameRecord
        }
      } catch (error) {
        if (attempt === 7) {
          throw error
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    throw new Error('Game settlement did not complete in time.')
  }

  return {
    createGameRecord,
    getGameRecord,
    joinMatch,
    markGameInProgress,
    completeGameRecord,
  }
}

type JoinGameResponse = {
  playerID: string
  playerCredentials: string
}

type GameRecordResponse = {
  game: {
    room_name?: string
    access?: { is_private?: boolean }
    coin_rules?: { stake?: number }
    coin_settlement?: { status?: string }
    players?: Array<{
      user_id?: string
      player_id: string
      display_name: string
      coins?: { delta?: number; reserved?: number }
      xp?: { delta?: number }
    }>
  }
}
