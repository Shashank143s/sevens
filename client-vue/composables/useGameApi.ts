type CreateGameRecordPayload = {
  room_size: number
  creator_user_id?: string
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
    return $fetch(buildGameUrl(matchID), {
      method: 'POST',
      body: payload,
    })
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
    createGameRecord,
    registerJoinedPlayer,
    markGameInProgress,
    completeGameRecord,
  }
}
