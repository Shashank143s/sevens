import { MAX_DAILY_GAMES_PER_USER } from '../config';
import { GameModel } from '../models';

function getUtcDayRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function countGamesCreatedToday(userId: string) {
  const { start, end } = getUtcDayRange();
  return GameModel.countDocuments({
    creator_user_id: userId,
    created_at: { $gte: start, $lt: end },
  });
}

export async function getRemainingRoomsForUser(userId?: string) {
  if (!userId) return MAX_DAILY_GAMES_PER_USER;
  const used = await countGamesCreatedToday(userId);
  return Math.max(MAX_DAILY_GAMES_PER_USER - used, 0);
}

export async function ensureRoomQuotaAvailable(userId?: string) {
  const remainingRooms = await getRemainingRoomsForUser(userId);
  if (remainingRooms > 0) return remainingRooms;

  const error = new Error('Daily room creation limit reached. You can still join existing rooms.');
  (error as Error & { status?: number; reason?: string }).status = 409;
  (error as Error & { status?: number; reason?: string }).reason = 'limit_breached';
  throw error;
}
