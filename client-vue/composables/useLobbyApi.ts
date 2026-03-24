import { useRuntimeConfig } from 'nuxt/app'

const GAME_NAME = 'sevens'

export interface MatchPlayer {
  id: number
  name?: string | null
  data?: { avatar?: string }
}

export interface LobbyMatch {
  matchID: string
  room_name?: string
  players: MatchPlayer[]
  setupData?: { numPlayers?: number; aiBots?: number }
  room_size?: number
  joined_count?: number
  game_status?: 'created' | 'in_progress' | 'completed' | 'abandoned' | 'open' | 'full'
  is_private?: boolean
}

export async function listMatches(): Promise<LobbyMatch[]> {
  const config = useRuntimeConfig()
  const res = await fetch(`${config.public.apiBase}/api/rooms`)
  if (!res.ok) throw new Error('Failed to list rooms')
  const data = await res.json()
  return Array.isArray(data) ? data as LobbyMatch[] : (data as { rooms?: LobbyMatch[] }).rooms ?? []
}

export async function createMatch(numPlayers: number, aiBots: number = 0): Promise<{ matchID: string }> {
  const config = useRuntimeConfig()
  const res = await fetch(`${config.public.apiBase}/games/${GAME_NAME}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numPlayers,
      setupData: aiBots > 0 ? { aiBots } : undefined,
    }),
  })
  if (!res.ok) throw new Error('Failed to create room')
  return res.json() as Promise<{ matchID: string }>
}

export function getMatchUrl(matchID: string): string {
  const config = useRuntimeConfig()
  return `${config.public.apiBase}/games/${GAME_NAME}/${matchID}`
}

/** Ask the server to join bot players to a match (call after creating a room with aiBots). */
export async function joinBots(matchID: string, aiBots: number): Promise<{ joined: number }> {
  const config = useRuntimeConfig()
  const res = await fetch(`${config.public.apiBase}/api/bot/join/${matchID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aiBots }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err?.error ?? 'Failed to join bots')
  }
  return res.json() as Promise<{ joined: number }>
}
