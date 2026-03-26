type UpsertAccountPayload = {
  email: string
  first_name: string
  last_name: string
  full_name: string
  profile_image_url?: string
  avatar_emoji?: string
  last_login_at: string
}

export type AccountApiUser = {
  _id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  profile_image_url?: string
  avatar_emoji?: string
  last_login_at: string
  stats?: {
    games_played: number
    wins: number
    losses: number
  }
  wallet?: {
    coins_balance: number
    coins_reserved: number
  }
  progression?: {
    xp_total: number
    level: number
  }
  daily_room_limit: number
  remaining_rooms: number
}

type UpsertAccountResponse = {
  user: AccountApiUser
}

export type AccountRecentGame = {
  match_id: string
  room_name?: string
  status: string
  room_size: number
  result: string
  coins_delta?: number
  xp_delta?: number
  winner_user_id?: string
  winner_name?: string
  winner_is_bot?: boolean
  ended_at?: string
}

type GetAccountResponse = {
  user: AccountApiUser
  recent_games_page: {
    games: AccountRecentGame[]
    offset: number
    limit: number
    has_more: boolean
  }
}

type DeleteAccountResponse = {
  deleted: boolean
}

export function useAccountApi() {
  const config = useRuntimeConfig()

  function buildAccountUrl(userID: string) {
    return `${config.public.apiBase}/api/account/${encodeURIComponent(userID)}`
  }

  async function getAccount(userID: string, offset = 0, limit = 5) {
    return $fetch<GetAccountResponse>(buildAccountUrl(userID), {
      query: { offset, limit },
    })
  }

  async function upsertAccount(userID: string, payload: UpsertAccountPayload) {
    return $fetch<UpsertAccountResponse>(buildAccountUrl(userID), {
      method: 'POST',
      body: payload,
    })
  }

  async function deleteAccount(userID: string) {
    return $fetch<DeleteAccountResponse>(buildAccountUrl(userID), {
      method: 'DELETE',
    })
  }

  return {
    deleteAccount,
    getAccount,
    upsertAccount,
  }
}
