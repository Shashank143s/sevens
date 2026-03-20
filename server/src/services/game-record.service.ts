import { Types } from 'mongoose';
import { GameModel } from '../models';
import type { CreateGamePayload, GamePlayerPayload, UpdateGamePayload } from '../types/game-record.types';
import { syncUserStatsForPlayers } from './user-stats.service';
import { ensureRoomQuotaAvailable } from './room-quota.service';
import { normalizeDate } from '../utils/user.util';

function toObjectId(value?: string) {
  return value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;
}

function resolveWinnerSeatId(payload: UpdateGamePayload) {
  return payload.winner_seat_id ?? payload.winner_player_id;
}

function normalizePlayer(player: GamePlayerPayload) {
  return {
    user_id: toObjectId(player.user_id),
    player_id: player.player_id.trim(),
    display_name: player.display_name.trim(),
    is_bot: player.is_bot ?? false,
    joined_at: player.joined_at ? normalizeDate(player.joined_at) : undefined,
    left_at: player.left_at ? normalizeDate(player.left_at) : undefined,
    result: player.result ?? 'unknown',
    finish_position: player.finish_position,
  };
}

function normalizePlayers(players?: GamePlayerPayload[]) {
  return (players ?? []).map(normalizePlayer);
}

function serializeExistingPlayer(player: any): GamePlayerPayload {
  return {
    user_id: player.user_id ? String(player.user_id) : undefined,
    player_id: String(player.player_id ?? ''),
    display_name: String(player.display_name ?? ''),
    is_bot: Boolean(player.is_bot),
    joined_at: player.joined_at,
    left_at: player.left_at,
    result: player.result ?? 'unknown',
    finish_position: player.finish_position,
  };
}

function normalizeExistingPlayers(players: any[]) {
  return normalizePlayers(players.map(serializeExistingPlayer));
}

async function findGameDocument(matchID: string) {
  return GameModel.findOne({ match_id: matchID });
}

function countPlayers(players: ReturnType<typeof normalizePlayers>) {
  return players.filter((player) => !player.is_bot).length;
}

function countBots(players: ReturnType<typeof normalizePlayers>) {
  return players.filter((player) => player.is_bot).length;
}

function markWinnerResults(players: ReturnType<typeof normalizePlayers>, winnerSeatId?: string) {
  return players.map((player) => ({
    ...player,
    result: winnerSeatId
      ? player.player_id === winnerSeatId
        ? 'won'
        : 'lost'
      : player.result,
  }));
}

function resolveWinnerUserId(players: any[], payload: UpdateGamePayload) {
  if (payload.winner_user_id) return payload.winner_user_id;
  const winnerSeatId = resolveWinnerSeatId(payload);
  if (!winnerSeatId) return undefined;
  const winner = players.find((player) => player.player_id === winnerSeatId);
  return winner?.user_id ? String(winner.user_id) : undefined;
}

function buildCreateDocument(matchID: string, payload: CreateGamePayload) {
  const players = normalizePlayers(payload.players);
  return {
    match_id: matchID,
    room_size: payload.room_size,
    creator_user_id: toObjectId(payload.creator_user_id),
    players,
    player_count: countPlayers(players),
    bot_count: countBots(players),
    status: 'created' as const,
    metadata: payload.metadata,
  };
}

function buildUpdateDocument(payload: UpdateGamePayload, players: any[]) {
  const winnerUserId = payload.winner_user_id;
  const winnerSeatId = resolveWinnerSeatId(payload);
  const shouldPersistPlayers = Boolean(
    payload.players || payload.joined_player || winnerSeatId || payload.status === 'completed',
  );
  return {
    ...(payload.room_size ? { room_size: payload.room_size } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(shouldPersistPlayers ? { players } : {}),
    ...(shouldPersistPlayers ? { player_count: countPlayers(players), bot_count: countBots(players) } : {}),
    ...(payload.status === 'completed' ? { winner_user_id: toObjectId(winnerUserId) ?? null } : {}),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
    ...buildStatusDates(payload),
  };
}

function buildStatusDates(payload: UpdateGamePayload) {
  if (payload.status === 'in_progress') {
    return { started_at: payload.started_at ? normalizeDate(payload.started_at) : new Date() };
  }

  if (payload.status === 'completed') {
    return { ended_at: payload.ended_at ? normalizeDate(payload.ended_at) : new Date() };
  }

  return {};
}

function applyPlayerResults(players: ReturnType<typeof normalizePlayers>, winnerSeatId?: string) {
  return winnerSeatId ? markWinnerResults(players, winnerSeatId) : players;
}

function mergeJoinedPlayer(existingPlayers: any[], joinedPlayer?: GamePlayerPayload) {
  if (!joinedPlayer) return existingPlayers;
  const normalizedPlayer = normalizePlayer(joinedPlayer);
  const withoutPlayer = existingPlayers.filter((player) => player.player_id !== normalizedPlayer.player_id);
  return [...withoutPlayer, normalizedPlayer];
}

function buildUpdatedPlayers(existingPlayers: any[], payload: UpdateGamePayload) {
  const normalizedExistingPlayers = normalizeExistingPlayers(existingPlayers);
  const winnerSeatId = resolveWinnerSeatId(payload);
  const nextPlayers = payload.players
    ? normalizePlayers(payload.players)
    : mergeJoinedPlayer(normalizedExistingPlayers, payload.joined_player);
  return applyPlayerResults(nextPlayers, winnerSeatId);
}

export async function getGameRecord(matchID: string) {
  return GameModel.findOne({ match_id: matchID }).lean();
}

export async function createGameRecord(matchID: string, payload: CreateGamePayload) {
  await ensureRoomQuotaAvailable(payload.creator_user_id);
  const game = new GameModel(buildCreateDocument(matchID, payload));
  return game.save();
}

export async function updateGameRecord(matchID: string, payload: UpdateGamePayload) {
  const game = await findGameDocument(matchID);
  if (!game) return null;
  const players = buildUpdatedPlayers(game.players, payload);
  const winnerUserId = resolveWinnerUserId(players, payload);
  const updatedGame = await GameModel.findOneAndUpdate(
    { match_id: matchID },
    { $set: buildUpdateDocument({ ...payload, winner_user_id: winnerUserId }, players) },
    { new: true, lean: true },
  );
  if (payload.status === 'completed') {
    await syncUserStatsForPlayers(players);
  }
  return updatedGame;
}
