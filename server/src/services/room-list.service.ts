import { GameModel } from '../models';
import { fetchLobbyMatches } from './game.service';
import type { RoomListItem, RoomMatchPayload } from '../types/room.types';

function normalizeLobbyPayload(payload: unknown): RoomMatchPayload[] {
  if (Array.isArray(payload)) return payload as RoomMatchPayload[];
  return (payload as { matches?: RoomMatchPayload[] })?.matches ?? [];
}

async function loadLobbyMatches() {
  const response = await fetchLobbyMatches();
  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(
      `Failed to load rooms: ${response.status} ${response.statusText}${responseBody ? ` :: ${responseBody.slice(0, 500)}` : ''}`,
    );
  }
  return normalizeLobbyPayload(await response.json());
}

async function loadRoomGames(matchIDs: string[]) {
  if (matchIDs.length === 0) return [];
  return GameModel.find(
    { match_id: { $in: matchIDs } } as any,
    {
      match_id: 1,
      room_name: 1,
      room_size: 1,
      status: 1,
      coin_rules: 1,
      access: 1,
      creator_display_name: 1,
      created_at: 1,
    } as any,
  )
    .lean();
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
    creator_name: game?.creator_display_name ?? undefined,
    room_size: roomSize,
    coin_stake: Math.max(game?.coin_rules?.stake ?? 10, 10),
    joined_count: joinedCount,
    game_status: resolveGameStatus(game?.status, joinedCount, roomSize),
    is_private: Boolean(game?.access?.is_private),
  };
}

function shouldIncludeRoom(match: RoomMatchPayload, gameMap: ReturnType<typeof buildGameMap>) {
  const game = gameMap.get(match.matchID);
  if (!game) return true;
  return !['completed', 'abandoned'].includes(game.status);
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
  const rooms = sortRoomsByCreatedAt(
    matches
      .filter((match) => shouldIncludeRoom(match, gameMap))
      .map((match) => buildRoomItem(match, gameMap)),
    gameMap,
  );
  return rooms;
}
