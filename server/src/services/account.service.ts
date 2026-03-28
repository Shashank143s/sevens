import { GameModel, UserModel } from '../models';
import { MAX_DAILY_GAMES_PER_USER } from '../config';
import type { AccountApiUserPayload, AccountGeoPayload, AccountPayload, LeaderboardEntry, RecentGameResult } from '../types/account.types';
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
    location: user.location
      ? {
          country_code: user.location.country_code,
          country_name: user.location.country_name,
          region: user.location.region,
        }
      : undefined,
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
    room_name: game.room_name,
    status: game.status,
    room_size: game.room_size,
    result: player?.result ?? 'unknown',
    coins_delta: player?.coins?.delta ?? 0,
    xp_delta: player?.xp?.delta ?? 0,
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
  const existingUser = await findUserByIdentifier(identifier);
  const lookup = existingUser ? createUserLookup(identifier) : { email };
  return UserModel.findOneAndUpdate(
    lookup as any,
    {
      $set: update,
      $unset: { deleted_at: 1 },
      $setOnInsert: {
        wallet: {
          coins_balance: 100,
          coins_reserved: 0,
        },
        progression: {
          xp_total: 0,
          level: 1,
        },
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

function buildLocationOnInsert(geo?: AccountGeoPayload) {
  if (!geo?.countryCode) return undefined;
  return {
    ip_address: geo.ipAddress,
    country_code: geo.countryCode,
    country_name: geo.countryName,
    region: geo.region,
    source: geo.source,
    captured_at: geo.capturedAt,
  };
}

export async function upsertAccountWithGeo(identifier: string, payload: AccountPayload, geo?: AccountGeoPayload) {
  const email = resolveEmail(identifier, payload);
  const update = buildAccountUpdate(payload, email);
  const existingUser = await findUserByIdentifier(identifier);
  const lookup = existingUser ? createUserLookup(identifier) : { email };
  const locationOnInsert = buildLocationOnInsert(geo);
  const setPayload = {
    ...update,
    ...(existingUser?.location?.country_code || !locationOnInsert
      ? {}
      : {
          location: locationOnInsert,
        }),
  };

  return UserModel.findOneAndUpdate(
    lookup as any,
    {
      $set: setPayload,
      $unset: { deleted_at: 1 },
      $setOnInsert: {
        wallet: {
          coins_balance: 100,
          coins_reserved: 0,
        },
        progression: {
          xp_total: 0,
          level: 1,
        },
        ...(locationOnInsert ? { location: locationOnInsert } : {}),
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

export async function getLeaderboard(limit = 25): Promise<{ entries: LeaderboardEntry[] }> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const users = await UserModel.find({ is_active: true } as any)
    .sort({
      'wallet.coins_balance': -1,
      'progression.level': -1,
      'progression.xp_total': -1,
      'stats.wins': -1,
      created_at: 1,
    })
    .limit(safeLimit)
    .lean();

  return {
    entries: users.map((user, index) => ({
      rank: index + 1,
      user_id: String(user._id),
      full_name: user.full_name,
      profile_image_url: user.profile_image_url ?? undefined,
      avatar_emoji: user.avatar_emoji,
      country_code: user.location?.country_code ?? undefined,
      country_name: user.location?.country_name ?? undefined,
      wins: user.stats?.wins ?? 0,
      games_played: user.stats?.games_played ?? 0,
      win_percentage: (user.stats?.games_played ?? 0) > 0
        ? Math.round(((user.stats?.wins ?? 0) / (user.stats?.games_played ?? 0)) * 100)
        : 0,
      coins_balance: user.wallet?.coins_balance ?? 0,
      level: user.progression?.level ?? 1,
      xp_total: user.progression?.xp_total ?? 0,
    })),
  };
}

export async function deleteAccountByIdentifier(identifier: string) {
  return UserModel.findOneAndUpdate(
    createUserLookup(identifier) as any,
    {
      $set: {
        is_active: false,
        deleted_at: new Date(),
      },
    },
    { new: true },
  );
}
