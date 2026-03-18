import { API_BASE } from '../config';
import type { JoinGamePayload } from '../types/service.types';

export async function fetchGameDetails(matchID: string): Promise<Response> {
  return fetch(`${API_BASE}/games/sevens/${matchID}`);
}

export async function joinGame(matchID: string, payload: JoinGamePayload): Promise<Response> {
  return fetch(`${API_BASE}/games/sevens/${matchID}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
