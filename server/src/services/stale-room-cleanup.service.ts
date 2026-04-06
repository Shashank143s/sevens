import { GameModel } from '../models';
import { STALE_ROOM_CUTOFF_MINUTES } from '../config';
import { voidEconomySettlement } from './user-economy.service';

const STALE_ROOM_WINDOW_MS = Math.max(STALE_ROOM_CUTOFF_MINUTES, 1) * 60 * 1000;

type CleanupTargetGame = {
  _id: unknown;
  match_id: string;
  status: 'created' | 'in_progress' | 'completed' | 'abandoned';
  updated_at?: Date | string;
  players: any[];
  coin_settlement?: {
    status?: 'pending' | 'completed' | 'void';
  };
  xp_settlement?: {
    status?: 'pending' | 'completed' | 'void';
  };
  coin_rules?: {
    stake?: number;
    bot_reward?: number;
  };
};

export type StaleRoomCleanupResult = {
  cutoff_iso: string;
  stale_rooms_found: number;
  abandoned_rooms: number;
  deleted_matches: number;
  refunded_rooms: number;
  skipped_rooms: number;
  failed_rooms: Array<{
    match_id: string;
    reason: string;
  }>;
};

function getCutoffDate(now = new Date()) {
  return new Date(now.getTime() - STALE_ROOM_WINDOW_MS);
}

function shouldSkipCleanup(game: CleanupTargetGame) {
  return game.status === 'completed'
    || game.status === 'abandoned'
    || game.coin_settlement?.status !== 'pending';
}

async function findStaleGames(cutoff: Date) {
  return GameModel.find(
    {
      status: { $in: ['created', 'in_progress'] },
      updated_at: { $lte: cutoff },
    } as any,
  ).lean<CleanupTargetGame[]>();
}

async function abandonGame(game: CleanupTargetGame) {
  const settlement = await voidEconomySettlement(game, game.players ?? []);
  const updatedGame = await GameModel.findOneAndUpdate(
    {
      _id: game._id,
      status: { $in: ['created', 'in_progress'] },
      'coin_settlement.status': 'pending',
    } as any,
    {
      $set: {
        status: 'abandoned',
        players: settlement.players,
        coin_settlement: settlement.coin_settlement,
        xp_settlement: settlement.xp_settlement,
      },
    } as any,
    { returnDocument: 'after', lean: true },
  );

  return updatedGame ? settlement : null;
}

export async function cleanupStaleRooms(
  deleteMatch: (matchID: string) => Promise<void>,
): Promise<StaleRoomCleanupResult> {
  const cutoff = getCutoffDate();
  const staleGames = await findStaleGames(cutoff);
  const result: StaleRoomCleanupResult = {
    cutoff_iso: cutoff.toISOString(),
    stale_rooms_found: staleGames.length,
    abandoned_rooms: 0,
    deleted_matches: 0,
    refunded_rooms: 0,
    skipped_rooms: 0,
    failed_rooms: [],
  };

  for (const game of staleGames) {
    try {
      if (shouldSkipCleanup(game)) {
        result.skipped_rooms += 1;
        continue;
      }

      const settlement = await abandonGame(game);
      if (!settlement) {
        result.skipped_rooms += 1;
        continue;
      }

      result.abandoned_rooms += 1;

      if (settlement.coin_settlement?.status === 'void') {
        result.refunded_rooms += 1;
      }

      await deleteMatch(game.match_id);
      result.deleted_matches += 1;
    } catch (error) {
      result.failed_rooms.push({
        match_id: game.match_id,
        reason: error instanceof Error ? error.message : 'Unknown cleanup failure',
      });
    }
  }

  return result;
}
