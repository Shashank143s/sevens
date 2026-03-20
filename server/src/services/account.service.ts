import { GameModel, UserModel } from '../models';
import { MAX_DAILY_GAMES_PER_USER } from '../config';
import type { AccountApiUserPayload, AccountPayload, RecentGameResult } from '../types/account.types';
import { syncUserStats } from './user-stats.service';
import { getRemainingRoomsForUser } from './room-quota.service';
import { buildFullName, splitFullName } from '../utils/name.util';
import { createUserLookup, normalizeDate, normalizeEmail } from '../utils/user.util';

function buildNames(payload: AccountPayload) {
  if (payload.first_name && payload.last_name) {
    return { firstName: payload.first_name.trim(), lastName: payload.last_name.trim() };
  }

  return splitFullName(payload.full_name ?? '');
}

function buildAccountUpdate(payload: AccountPayload, email: string) {
  const { firstName, lastName } = buildNames(payload);
  return {
    email,
    first_name: firstName,
    last_name: lastName,
    full_name: buildFullName(firstName, lastName),
    profile_image_url: payload.profile_image_url?.trim(),
    avatar_emoji: payload.avatar_emoji?.trim() ?? '🐶',
    last_login_at: normalizeDate(payload.last_login_at),
    is_active: true,
  };
}

async function findUserByIdentifier(identifier: string) {
  return UserModel.findOne(createUserLookup(identifier) as any).lean();
}

async function findUserById(userId: string) {
  return UserModel.findById(userId).lean();
}

function normalizePaginationValue(value: number, fallback: number) {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

async function buildAccountUser(user: any): Promise<AccountApiUserPayload> {
  const remainingRooms = await getRemainingRoomsForUser(String(user._id));
  return {
    ...user,
    _id: String(user._id),
    daily_room_limit: MAX_DAILY_GAMES_PER_USER,
    remaining_rooms: remainingRooms,
  };
}

function mapRecentGame(game: any, userId: string): RecentGameResult {
  const player = game.players.find((entry: any) => String(entry.user_id) === userId);
  const winner = game.players.find((entry: any) => entry.result === 'won');
  const hasBots = (game.bot_count ?? 0) > 0 || game.players.some((entry: any) => entry.is_bot);
  const winnerIsBot = winner?.is_bot ?? (game.status === 'completed' && !game.winner_user_id && hasBots);
  return {
    match_id: game.match_id,
    status: game.status,
    room_size: game.room_size,
    result: player?.result ?? 'unknown',
    winner_user_id: game.winner_user_id ? String(game.winner_user_id) : undefined,
    winner_name: winner?.display_name,
    winner_is_bot: winnerIsBot,
    ended_at: game.ended_at,
  };
}

async function findRecentGames(userId: string, offset = 0, limit = 5) {
  const safeOffset = normalizePaginationValue(offset, 0);
  const safeLimit = Math.min(normalizePaginationValue(limit, 5), 25);
  const games = await GameModel.find({ 'players.user_id': userId })
    .sort({ ended_at: -1, updated_at: -1 })
    .skip(safeOffset)
    .limit(safeLimit + 1)
    .lean();

  return {
    games: games.slice(0, safeLimit).map((game) => mapRecentGame(game, userId)),
    has_more: games.length > safeLimit,
    offset: safeOffset,
    limit: safeLimit,
  };
}

// Returns account data plus the recent history needed for the account page.
export async function getAccountByIdentifier(identifier: string, offset = 0, limit = 5) {
  const user = await findUserByIdentifier(identifier);
  if (!user) return null;
  const userId = String(user._id);
  await syncUserStats(userId);
  const refreshedUser = await findUserById(userId);
  const recent_games = await findRecentGames(userId, offset, limit);
  return { user: await buildAccountUser(refreshedUser ?? user), recent_games_page: recent_games };
}

function resolveEmail(identifier: string, payload: AccountPayload) {
  const email = payload.email?.trim() || identifier;
  return normalizeEmail(email);
}

export async function upsertAccountByIdentifier(identifier: string, payload: AccountPayload) {
  const email = resolveEmail(identifier, payload);
  const update = buildAccountUpdate(payload, email);
  const lookup = (await findUserByIdentifier(identifier)) ? createUserLookup(identifier) : { email };
  return UserModel.findOneAndUpdate(lookup as any, { $set: update }, { new: true, upsert: true });
}

export async function deleteAccountByIdentifier(identifier: string) {
  return UserModel.findOneAndUpdate(
    createUserLookup(identifier) as any,
    { $set: { is_active: false } },
    { new: true },
  );
}
