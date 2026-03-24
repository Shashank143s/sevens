import { GameModel } from '../models';
import { fetchLobbyMatches } from './game.service';
import type { RoomListItem, RoomMatchPayload } from '../types/room.types';

function normalizeLobbyPayload(payload: unknown): RoomMatchPayload[] {
  if (Array.isArray(payload)) return payload as RoomMatchPayload[];
  return (payload as { matches?: RoomMatchPayload[] })?.matches ?? [];
}

async function loadLobbyMatches() {
  const response = await fetchLobbyMatches();
  if (!response.ok) throw new Error('Failed to load rooms');
  return normalizeLobbyPayload(await response.json());
}

async function loadRoomGames(matchIDs: string[]) {
  if (matchIDs.length === 0) return [];
  return GameModel.find({ match_id: { $in: matchIDs } }).lean();
}

function buildGameMap(games: Awaited<ReturnType<typeof loadRoomGames>>) {
  return new Map(games.map((game) => [game.match_id, game]));
}

function countJoinedPlayers(players: RoomMatchPayload['players']) {
  return players.filter((player) => player.name?.trim()).length;
}

function resolveGameStatus(
  gameStatus: RoomListItem['game_status'] | undefined,
  joinedCount: number,
  roomSize: number,
) {
  if (gameStatus) return gameStatus;
  return joinedCount >= roomSize ? 'full' : 'open';
}

function buildRoomItem(match: RoomMatchPayload, gameMap: ReturnType<typeof buildGameMap>): RoomListItem {
  const game = gameMap.get(match.matchID);
  const roomSize = game?.room_size ?? match.setupData?.numPlayers ?? match.players.length;
  const joinedCount = countJoinedPlayers(match.players);
  return {
    ...match,
    room_name: game?.room_name ?? `Room ${match.matchID.slice(0, 4)}`,
    room_size: roomSize,
    joined_count: joinedCount,
    game_status: resolveGameStatus(game?.status, joinedCount, roomSize),
    is_private: Boolean(game?.access?.is_private),
  };
}

function sortRoomsByCreatedAt(
  rooms: RoomListItem[],
  gameMap: ReturnType<typeof buildGameMap>,
) {
  return [...rooms].sort((left, right) => {
    const leftCreatedAt = gameMap.get(left.matchID)?.created_at
      ? new Date(gameMap.get(left.matchID)!.created_at).getTime()
      : 0;
    const rightCreatedAt = gameMap.get(right.matchID)?.created_at
      ? new Date(gameMap.get(right.matchID)!.created_at).getTime()
      : 0;
    return rightCreatedAt - leftCreatedAt;
  });
}

export async function listRooms() {
  const matches = await loadLobbyMatches();
  const gameMap = buildGameMap(await loadRoomGames(matches.map((match) => match.matchID)));
  return sortRoomsByCreatedAt(
    matches.map((match) => buildRoomItem(match, gameMap)),
    gameMap,
  );
}
