import { Types } from 'mongoose';
import { GameModel, UserModel } from '../models';
import type { CreateGamePayload, GamePlayerPayload, UpdateGamePayload } from '../types/game-record.types';
import { syncUserStatsForPlayers } from './user-stats.service';
import {
  ensureAvailableCoinsForUser,
  reserveCoinsForJoin,
  settleCompletedEconomy,
  voidEconomySettlement,
} from './user-economy.service';
import { ensureRoomQuotaAvailable } from './room-quota.service';
import { normalizeDate } from '../utils/user.util';
import { hashRoomPassword, normalizeRoomPassword, verifyRoomPassword } from '../utils/password.util';
import { validateRoomName } from '../utils/room.util';

const SETTLEMENT_TAKEOVER_WINDOW_MS = 30_000;

function toObjectId(value?: string) {
  return value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;
}

function createConflictError(message: string, reason: string) {
  const error = new Error(message) as Error & { status: number; reason: string };
  error.status = 409;
  error.reason = reason;
  return error;
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
    coins: {
      reserved: Math.max(player.coins?.reserved ?? 0, 0),
      delta: player.coins?.delta ?? 0,
    },
    xp: {
      delta: Math.max(player.xp?.delta ?? 0, 0),
    },
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
    coins: {
      reserved: player.coins?.reserved ?? 0,
      delta: player.coins?.delta ?? 0,
    },
    xp: {
      delta: player.xp?.delta ?? 0,
    },
  };
}

function normalizeExistingPlayers(players: any[]) {
  return normalizePlayers(players.map(serializeExistingPlayer));
}

async function findGameDocument(matchID: string) {
  return GameModel.findOne({ match_id: matchID });
}

async function claimCoinSettlement(matchID: string) {
  const staleTakeoverCutoff = new Date(Date.now() - SETTLEMENT_TAKEOVER_WINDOW_MS);
  return GameModel.findOneAndUpdate(
    {
      match_id: matchID,
      $or: [
        {
          'coin_settlement.status': 'pending',
        },
        {
          'coin_settlement.status': 'settling',
          $or: [
            { 'coin_settlement.recovery_inflight': { $ne: true } },
            { 'coin_settlement.recovery_started_at': { $lte: staleTakeoverCutoff } },
          ],
        },
      ],
    } as any,
    {
      $set: {
        'coin_settlement.status': 'settling',
        'xp_settlement.status': 'settling',
        'coin_settlement.recovery_inflight': true,
        'xp_settlement.recovery_inflight': true,
        'coin_settlement.recovery_started_at': new Date(),
        'xp_settlement.recovery_started_at': new Date(),
      },
    } as any,
    { returnDocument: 'after', lean: true },
  );
}

function buildExistingSettlementResult(game: any, payload: UpdateGamePayload) {
  return {
    players: buildUpdatedPlayers(game.players ?? [], payload),
    coin_settlement: game.coin_settlement,
    xp_settlement: game.xp_settlement,
  };
}

function hasUnreleasedHumanReservations(players: any[]) {
  return (players ?? []).some((player) => !player.is_bot && (player.coins?.reserved ?? 0) > 0);
}

async function settleCompletionIdempotently(
  matchID: string,
  game: any,
  payload: UpdateGamePayload,
  players: any[],
) {
  const coinSettlementStatus = game.coin_settlement?.status;
  if (coinSettlementStatus === 'completed' || coinSettlementStatus === 'void') {
    return buildExistingSettlementResult(game, payload);
  }

  const settlementClaim = await claimCoinSettlement(matchID);
  if (settlementClaim) {
    return settleCompletedEconomy(matchID, game, players, resolveWinnerSeatId(payload));
  }

  const latestGame = await getGameRecord(matchID);
  if (latestGame?.coin_settlement?.status === 'settling' && hasUnreleasedHumanReservations(latestGame.players ?? [])) {
    throw createConflictError(
      'Game settlement is currently in progress. Please retry completion shortly.',
      'settlement_in_progress',
    );
  }
  console.warn(
    '[game-record] Completion lock already claimed; finalizing status without duplicate settlement:',
    matchID,
    latestGame?.coin_settlement?.status ?? game.coin_settlement?.status ?? 'unknown',
  );
  return buildExistingSettlementResult(latestGame ?? game, payload);
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

function buildCreateDocument(matchID: string, payload: CreateGamePayload, creatorDisplayName?: string) {
  const players = normalizePlayers(payload.players);
  return {
    match_id: matchID,
    room_name: validateRoomName(payload.room_name),
    room_size: payload.room_size,
    creator_user_id: toObjectId(payload.creator_user_id),
    creator_display_name: creatorDisplayName,
    players,
    player_count: countPlayers(players),
    bot_count: countBots(players),
    status: 'created' as const,
    coin_rules: {
      stake: Math.max(payload.coin_rules?.stake ?? 10, 10),
      bot_reward: 10,
    },
    coin_settlement: {
      status: 'pending' as const,
      human_player_count: countPlayers(players),
      bot_count: countBots(players),
      human_pot: countPlayers(players) * Math.max(payload.coin_rules?.stake ?? 10, 10),
      bot_bonus: 0,
    },
    xp_settlement: {
      status: 'pending' as const,
    },
    access: buildAccessDocument(payload),
    metadata: payload.metadata,
  };
}

async function resolveCreatorDisplayName(userId?: string) {
  if (!userId || !Types.ObjectId.isValid(userId)) return undefined;

  const creator = await UserModel.findById(userId, { full_name: 1, first_name: 1 } as any).lean();
  if (!creator) return undefined;
  return creator.full_name ?? creator.first_name ?? undefined;
}

function buildAccessDocument(payload: CreateGamePayload) {
  const password = normalizeRoomPassword(payload.access?.password);
  const isPrivate = Boolean(payload.access?.is_private && password);
  return {
    is_private: isPrivate,
    password_hash: isPrivate ? hashRoomPassword(password) : undefined,
  };
}

function buildUpdateDocument(payload: UpdateGamePayload, players: any[]) {
  const winnerUserId = payload.winner_user_id;
  const winnerSeatId = resolveWinnerSeatId(payload);
  const shouldPersistPlayers = Boolean(
    payload.players || payload.joined_player || winnerSeatId || payload.status === 'completed' || payload.status === 'abandoned',
  );
  return {
    ...(payload.room_size ? { room_size: payload.room_size } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(shouldPersistPlayers ? { players } : {}),
    ...(shouldPersistPlayers ? { player_count: countPlayers(players), bot_count: countBots(players) } : {}),
    ...(payload.status === 'completed' ? { winner_user_id: toObjectId(winnerUserId) ?? null } : {}),
    ...(payload.coin_settlement ? { coin_settlement: payload.coin_settlement } : {}),
    ...(payload.xp_settlement ? { xp_settlement: payload.xp_settlement } : {}),
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

type JoinedPlayerIdentity = {
  user_id?: string | Types.ObjectId;
  player_id: string;
};

function isSameJoinedPlayer(existingPlayer: any, joinedPlayer?: JoinedPlayerIdentity) {
  if (!joinedPlayer) return false;

  if (
    joinedPlayer.user_id
    && existingPlayer.user_id
    && String(existingPlayer.user_id) === String(joinedPlayer.user_id)
  ) {
    return true;
  }

  return String(existingPlayer.player_id) === String(joinedPlayer.player_id);
}

function mergeJoinedPlayer(existingPlayers: any[], joinedPlayer?: GamePlayerPayload) {
  if (!joinedPlayer) return existingPlayers;
  const normalizedPlayer = normalizePlayer(joinedPlayer);
  const existingPlayer = existingPlayers.find((player) => isSameJoinedPlayer(player, normalizedPlayer));
  const withoutPlayer = existingPlayers.filter((player) => !isSameJoinedPlayer(player, normalizedPlayer));
  return [
    ...withoutPlayer,
    {
      ...normalizedPlayer,
      player_id:
        existingPlayer?.user_id
        && normalizedPlayer.user_id
        && String(existingPlayer.user_id) === String(normalizedPlayer.user_id)
          ? existingPlayer.player_id
          : normalizedPlayer.player_id,
      user_id: existingPlayer?.user_id ?? normalizedPlayer.user_id,
      joined_at: existingPlayer?.joined_at ?? normalizedPlayer.joined_at,
      left_at: existingPlayer?.left_at ?? normalizedPlayer.left_at,
      result: existingPlayer?.result ?? normalizedPlayer.result,
      finish_position: existingPlayer?.finish_position ?? normalizedPlayer.finish_position,
      coins: existingPlayer?.coins ?? normalizedPlayer.coins,
      xp: existingPlayer?.xp ?? normalizedPlayer.xp,
    },
  ];
}

function buildUpdatedPlayers(existingPlayers: any[], payload: UpdateGamePayload) {
  const normalizedExistingPlayers = normalizeExistingPlayers(existingPlayers);
  const winnerSeatId = resolveWinnerSeatId(payload);
  const nextPlayers = payload.players
    ? normalizePlayers(payload.players)
    : mergeJoinedPlayer(normalizedExistingPlayers, payload.joined_player);
  return applyPlayerResults(nextPlayers, winnerSeatId);
}

function hasReservedCoinsForSeat(existingPlayers: any[], joinedPlayer?: GamePlayerPayload) {
  if (!joinedPlayer) return false;
  const existingPlayer = normalizeExistingPlayers(existingPlayers).find(
    (player) => isSameJoinedPlayer(player, joinedPlayer),
  );
  return (existingPlayer?.coins?.reserved ?? 0) > 0;
}

async function reserveJoinedPlayerCoins(game: any, payload: UpdateGamePayload) {
  const joinedPlayer = payload.joined_player;
  if (!joinedPlayer?.user_id || joinedPlayer.is_bot) return;
  if (hasReservedCoinsForSeat(game.players, joinedPlayer)) return;
  await reserveCoinsForJoin(joinedPlayer.user_id, Math.max(game.coin_rules?.stake ?? 10, 10));
  joinedPlayer.coins = {
    reserved: Math.max(game.coin_rules?.stake ?? 10, 10),
    delta: 0,
  };
  joinedPlayer.xp = {
    delta: 0,
  };
}

async function applySettlementIfNeeded(game: any, payload: UpdateGamePayload, players: any[]) {
  if (payload.status === 'abandoned' && game.coin_settlement?.status === 'pending') {
    return voidEconomySettlement(game, players);
  }

  return {
    players,
    coin_settlement: game.coin_settlement,
    xp_settlement: game.xp_settlement,
  };
}

export async function getGameRecord(matchID: string) {
  return GameModel.findOne({ match_id: matchID }).lean();
}

export async function getPublicGameRecord(matchID: string) {
  const game = await getGameRecord(matchID);
  if (!game) return null;
  return {
    ...game,
    access: {
      is_private: Boolean(game.access?.is_private),
    },
  };
}

export async function createGameRecord(matchID: string, payload: CreateGamePayload) {
  await ensureRoomQuotaAvailable(payload.creator_user_id);
  if (payload.creator_user_id) {
    await ensureAvailableCoinsForUser(
      payload.creator_user_id,
      Math.max(payload.coin_rules?.stake ?? 10, 10),
    );
  }
  const creatorDisplayName = await resolveCreatorDisplayName(payload.creator_user_id);
  const game = new GameModel(buildCreateDocument(matchID, payload, creatorDisplayName));
  return game.save();
}

export async function authorizeGameJoin(matchID: string, password?: string, userId?: string) {
  const game = await getGameRecord(matchID);
  if (!game) return null;
  if (userId) {
    const existingSeat = (game.players ?? []).find((player) => (
      !player.is_bot
      && !player.left_at
      && player.user_id
      && String(player.user_id) === String(userId)
    ));
    if (existingSeat) {
      return { allowed: false, already_joined: true, player_id: existingSeat.player_id };
    }
  }
  if (userId) {
    await ensureAvailableCoinsForUser(userId, Math.max(game.coin_rules?.stake ?? 10, 10));
  }
  if (!game.access?.is_private) return { allowed: true };
  const normalizedPassword = normalizeRoomPassword(password);
  const passwordHash = game.access.password_hash ?? '';
  const allowed = normalizedPassword.length > 0 && verifyRoomPassword(normalizedPassword, passwordHash);
  return { allowed, is_private: true };
}

export async function updateGameRecord(matchID: string, payload: UpdateGamePayload) {
  const game = await findGameDocument(matchID);
  if (!game) return null;
  await reserveJoinedPlayerCoins(game, payload);
  const players = buildUpdatedPlayers(game.players, payload);
  const settlement = payload.status === 'completed'
    ? await settleCompletionIdempotently(matchID, game, payload, players)
    : await applySettlementIfNeeded(game, payload, players);
  const finalPlayers = settlement.players;
  const winnerUserId = resolveWinnerUserId(finalPlayers, payload);
  const updatedGame = await GameModel.findOneAndUpdate(
    { match_id: matchID },
    {
      $set: buildUpdateDocument(
        {
          ...payload,
          winner_user_id: winnerUserId,
          coin_settlement: settlement.coin_settlement,
          xp_settlement: settlement.xp_settlement,
        },
        finalPlayers,
      ),
    },
    { returnDocument: 'after', lean: true },
  );
  if (payload.status === 'completed') {
    await syncUserStatsForPlayers(finalPlayers);
  }
  return updatedGame;
}
