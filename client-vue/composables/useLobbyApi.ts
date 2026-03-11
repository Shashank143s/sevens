const API_BASE = 'http://localhost:8000'
const GAME_NAME = 'sevens'

export interface MatchPlayer {
  id: number
  name?: string | null
  data?: { avatar?: string }
}

export interface LobbyMatch {
  matchID: string
  players: MatchPlayer[]
  setupData?: { numPlayers?: number; aiBots?: number }
}

export async function listMatches(): Promise<LobbyMatch[]> {
  const res = await fetch(`${API_BASE}/games/${GAME_NAME}`)
  if (!res.ok) throw new Error('Failed to list rooms')
  const data = await res.json()
  return Array.isArray(data) ? data as LobbyMatch[] : (data as { matches?: LobbyMatch[] }).matches ?? []
}

export async function createMatch(numPlayers: number, aiBots: number = 0): Promise<{ matchID: string }> {
  const res = await fetch(`${API_BASE}/games/${GAME_NAME}/create`, {
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
  return `${API_BASE}/games/${GAME_NAME}/${matchID}`
}

/** Ask the server to join bot players to a match (call after creating a room with aiBots). */
export async function joinBots(matchID: string, aiBots: number): Promise<{ joined: number }> {
  const res = await fetch(`${API_BASE}/api/bot/join/${matchID}`, {
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
