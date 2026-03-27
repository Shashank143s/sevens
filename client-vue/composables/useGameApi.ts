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

type JoinGameRecordPayload = {
  joined_player: {
    user_id?: string
    player_id: string
    display_name: string
    is_bot?: boolean
    joined_at: string
  }
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
    return $fetch<{
      game: {
        room_name?: string
        access?: { is_private?: boolean }
        coin_rules?: { stake?: number }
        players?: Array<{
          user_id?: string
          player_id: string
          display_name: string
          coins?: { delta?: number; reserved?: number }
          xp?: { delta?: number }
        }>
      }
    }>(buildGameUrl(matchID))
  }

  async function authorizeJoin(matchID: string, password?: string, userID?: string) {
    try {
      return await $fetch(`${buildGameUrl(matchID)}/authorize-join`, {
        method: 'POST',
        body: { password, user_id: userID },
      })
    } catch (error: any) {
      throw new Error(error?.data?.error ?? 'Unable to join this room')
    }
  }

  async function registerJoinedPlayer(matchID: string, payload: JoinGameRecordPayload) {
    return $fetch(buildGameUrl(matchID), {
      method: 'PUT',
      body: payload,
    })
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
    return $fetch(buildGameUrl(matchID), {
      method: 'PUT',
      body: {
        status: 'completed',
        winner_seat_id: winnerPlayerID,
        ended_at: new Date().toISOString(),
      },
    })
  }

  return {
    authorizeJoin,
    createGameRecord,
    getGameRecord,
    registerJoinedPlayer,
    markGameInProgress,
    completeGameRecord,
  }
}
