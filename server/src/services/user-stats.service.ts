import { Types } from 'mongoose';
import { GameModel, UserModel } from '../models';

function toObjectId(userId: string) {
  return Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
}

function buildStatsUpdate(stats?: {
  games_played?: number;
  wins?: number;
  losses?: number;
}) {
  return {
    'stats.games_played': stats?.games_played ?? 0,
    'stats.wins': stats?.wins ?? 0,
    'stats.losses': stats?.losses ?? 0,
  };
}

async function fetchDerivedStats(userId: string) {
  const objectId = toObjectId(userId);
  if (!objectId) return buildStatsUpdate();

  const [stats] = await GameModel.aggregate([
    { $match: { status: 'completed', 'players.user_id': objectId } },
    { $unwind: '$players' },
    { $match: { 'players.user_id': objectId, 'players.is_bot': false } },
    {
      $group: {
        _id: null,
        games_played: { $sum: 1 },
        wins: {
          $sum: { $cond: [{ $eq: ['$players.result', 'won'] }, 1, 0] },
        },
      },
    },
  ]);

  const gamesPlayed = stats?.games_played ?? 0;
  const wins = stats?.wins ?? 0;

  // Any completed human game not marked as a win is treated as a loss.
  // This keeps historical bot-win records with `result: "unknown"` from
  // incorrectly showing zero losses.
  return buildStatsUpdate({
    games_played: gamesPlayed,
    wins,
    losses: Math.max(gamesPlayed - wins, 0),
  });
}

export async function syncUserStats(userId: string) {
  const stats = await fetchDerivedStats(userId);
  await UserModel.updateOne({ _id: userId }, { $set: stats } as any);
}

export async function syncUserStatsForPlayers(players: any[]) {
  const userIds = [...new Set(
    players
      .filter((player) => player.user_id && !player.is_bot)
      .map((player) => String(player.user_id)),
  )];

  if (!userIds.length) return;
  await Promise.all(userIds.map(syncUserStats));
}
