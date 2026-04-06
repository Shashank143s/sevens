import { API_BASE, PORT } from '../config';
import type { JoinGamePayload } from '../types/service.types';

const INTERNAL_API_BASE = `http://127.0.0.1:${PORT}`;

export async function fetchLobbyMatches(): Promise<Response> {
  return fetch(`${INTERNAL_API_BASE}/games/sevens`);
}

export async function fetchGameDetails(matchID: string): Promise<Response> {
  return fetch(`${INTERNAL_API_BASE}/games/sevens/${matchID}`);
}

export async function joinGame(matchID: string, payload: JoinGamePayload): Promise<Response> {
  return fetch(`${INTERNAL_API_BASE}/games/sevens/${matchID}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
