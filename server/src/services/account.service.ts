import { Types } from 'mongoose';
import { GameModel, UserModel } from '../models';
import { MAX_DAILY_GAMES_PER_USER } from '../config';
import type { AccountApiUserPayload, AccountGamesResponse, AccountGeoPayload, AccountPayload, LeaderboardEntry, LeaderboardResponse, RecentGameResult } from '../types/account.types';
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
    ...(payload.legal_consent
      ? {
          legal_consent: {
            privacy_policy_accepted_at: payload.legal_consent.privacy_policy_accepted_at
              ? normalizeDate(payload.legal_consent.privacy_policy_accepted_at)
              : undefined,
            terms_accepted_at: payload.legal_consent.terms_accepted_at
              ? normalizeDate(payload.legal_consent.terms_accepted_at)
              : undefined,
          },
        }
      : {}),
    is_active: true,
  };
}

async function findUserByIdentifier(identifier: string) {
  return UserModel.findOne(createUserLookup(identifier) as any).lean();
}

async function findAccountSummaryByIdentifier(identifier: string) {
  return UserModel.findOne(createUserLookup(identifier) as any, {
    email: 1,
    first_name: 1,
    last_name: 1,
    full_name: 1,
    profile_image_url: 1,
    avatar_emoji: 1,
    last_login_at: 1,
    is_active: 1,
    deleted_at: 1,
    wallet: 1,
    progression: 1,
    location: 1,
    legal_consent: 1,
    created_at: 1,
    updated_at: 1,
  } as any).lean();
}

async function findGamesUserByIdentifier(identifier: string) {
  return UserModel.findOne(createUserLookup(identifier) as any, {
    stats: 1,
  } as any).lean();
}

function normalizePaginationValue(value: number, fallback: number) {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

function buildAccountUserBase(user: any): Omit<AccountApiUserPayload, 'daily_room_limit' | 'remaining_rooms'> {
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
    legal_consent: user.legal_consent
      ? {
          privacy_policy_accepted_at: user.legal_consent.privacy_policy_accepted_at,
          terms_accepted_at: user.legal_consent.terms_accepted_at,
        }
      : undefined,
  };
}

async function buildAccountUser(user: any): Promise<AccountApiUserPayload> {
  const remainingRooms = await getRemainingRoomsForUser(String(user._id));
  return {
    ...buildAccountUserBase(user),
    daily_room_limit: MAX_DAILY_GAMES_PER_USER,
    remaining_rooms: remainingRooms,
  };
}

function buildAccountSummaryUser(user: any): AccountApiUserPayload {
  return buildAccountUserBase(user);
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
  if (safeLimit === 0) {
    return {
      games: [],
      has_more: false,
      offset: safeOffset,
      limit: safeLimit,
    };
  }
  const games = await GameModel.find(
    { 'players.user_id': userId },
    {
      match_id: 1,
      room_name: 1,
      status: 1,
      room_size: 1,
      winner_user_id: 1,
      ended_at: 1,
      updated_at: 1,
      bot_count: 1,
      players: 1,
    } as any,
  )
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
  const user = await findAccountSummaryByIdentifier(identifier);
  if (!user) return null;
  const userId = String(user._id);
  const recent_games = await findRecentGames(userId, offset, limit);
  return { user: await buildAccountUser(user), recent_games_page: recent_games };
}

export async function getAccountSummaryByIdentifier(identifier: string) {
  const user = await findAccountSummaryByIdentifier(identifier);
  if (!user) return null;
  return { user: buildAccountSummaryUser(user) };
}

export async function getAccountGamesByIdentifier(identifier: string, offset = 0, limit = 5): Promise<AccountGamesResponse | null> {
  const isObjectIdIdentifier = Types.ObjectId.isValid(identifier);

  let user: Awaited<ReturnType<typeof findGamesUserByIdentifier>> | null = null;
  let recent_games: Awaited<ReturnType<typeof findRecentGames>>;

  if (isObjectIdIdentifier) {
    const results = await Promise.all([
      findGamesUserByIdentifier(identifier),
      findRecentGames(identifier, offset, limit),
    ]);
    [user, recent_games] = results;
  } else {
    user = await findGamesUserByIdentifier(identifier);
    if (!user) return null;
    recent_games = await findRecentGames(String(user._id), offset, limit);
  }

  if (!user) return null;
  return {
    user: {
      _id: String(user._id),
      stats: user.stats ?? {
        games_played: 0,
        wins: 0,
        losses: 0,
      },
    },
    recent_games_page: recent_games,
  };
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
      returnDocument: 'after',
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
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

function mapLeaderboardEntry(user: any, rank: number): LeaderboardEntry {
  return {
    rank,
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
  };
}

async function getLeaderboardRank(user: any): Promise<number> {
  const coinsBalance = user.wallet?.coins_balance ?? 0;
  const level = user.progression?.level ?? 1;
  const xpTotal = user.progression?.xp_total ?? 0;
  const wins = user.stats?.wins ?? 0;
  const createdAt = user.created_at ?? new Date(0);

  const usersAhead = await UserModel.countDocuments({
    is_active: true,
    $or: [
      { 'wallet.coins_balance': { $gt: coinsBalance } },
      { 'wallet.coins_balance': coinsBalance, 'progression.level': { $gt: level } },
      { 'wallet.coins_balance': coinsBalance, 'progression.level': level, 'progression.xp_total': { $gt: xpTotal } },
      { 'wallet.coins_balance': coinsBalance, 'progression.level': level, 'progression.xp_total': xpTotal, 'stats.wins': { $gt: wins } },
      { 'wallet.coins_balance': coinsBalance, 'progression.level': level, 'progression.xp_total': xpTotal, 'stats.wins': wins, created_at: { $lt: createdAt } },
    ],
  } as any);

  return usersAhead + 1;
}

export async function getLeaderboard(limit = 25, identifier?: string): Promise<LeaderboardResponse> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const findEntriesPromise = UserModel.find(
    { is_active: true } as any,
    {
      full_name: 1,
      profile_image_url: 1,
      avatar_emoji: 1,
      location: 1,
      stats: 1,
      wallet: 1,
      progression: 1,
      created_at: 1,
    } as any,
  )
    .sort({
      'wallet.coins_balance': -1,
      'progression.level': -1,
      'progression.xp_total': -1,
      'stats.wins': -1,
      created_at: 1,
    })
    .limit(safeLimit)
    .lean();

  const findCurrentUserPromise = identifier
    ? findUserByIdentifier(identifier)
    : Promise.resolve(null);

  const [users, currentUser] = await Promise.all([
    findEntriesPromise,
    findCurrentUserPromise,
  ]);

  const entries = users.map((user, index) => mapLeaderboardEntry(user, index + 1));

  if (!identifier) {
    return { entries };
  }

  if (!currentUser || !currentUser.is_active) {
    return { entries };
  }

  const existingEntry = entries.find((entry) => entry.user_id === String(currentUser._id));
  if (existingEntry) {
    return {
      entries,
      current_user: existingEntry,
    };
  }

  const rank = await getLeaderboardRank(currentUser);
  return {
    entries,
    current_user: mapLeaderboardEntry(currentUser, rank),
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
    { returnDocument: 'after' },
  );
}
