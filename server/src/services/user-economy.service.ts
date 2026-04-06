import { Types } from 'mongoose';
import { UserModel } from '../models';
import { getLevelFromXp } from '../utils/progression.util';

const DEFAULT_STAKE = 10;
const XP_WIN = 20;
const XP_LOSS = 5;

type EconomyPlayer = {
  user_id?: string;
  player_id: string;
  is_bot?: boolean;
  coins?: {
    reserved?: number;
    delta?: number;
  };
  xp?: {
    delta?: number;
  };
};

type EconomyGame = {
  coin_rules?: {
    stake?: number;
    bot_reward?: number;
  };
};

function toObjectId(userId: string) {
  return Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
}

function createConflictError(message: string, reason: string) {
  const error = new Error(message) as Error & { status: number; reason: string };
  error.status = 409;
  error.reason = reason;
  return error;
}

export async function ensureAvailableCoinsForUser(userId: string, amount: number) {
  const objectId = toObjectId(userId);
  if (!objectId || amount <= 0) return;

  const user = await UserModel.findOne(
    {
      _id: objectId,
      is_active: true,
      $expr: {
        $gte: [{ $subtract: ['$wallet.coins_balance', '$wallet.coins_reserved'] }, amount],
      },
    } as any,
    { _id: 1 },
  ).lean();

  if (!user) {
    throw createConflictError(
      'Not enough available coins for this room.',
      'insufficient_coins',
    );
  }
}

function getStake(game: EconomyGame) {
  return Math.max(game.coin_rules?.stake ?? DEFAULT_STAKE, DEFAULT_STAKE);
}

function getBotReward(game: EconomyGame) {
  return Math.max(game.coin_rules?.bot_reward ?? DEFAULT_STAKE, 0);
}

function buildReservedCoinsClampUpdate(reservedAmount: number) {
  return {
    $max: [
      {
        $subtract: ['$wallet.coins_reserved', Math.max(reservedAmount, 0)],
      },
      0,
    ],
  };
}

async function syncUserLevels(userIds: string[]) {
  const objectIds = userIds
    .map(toObjectId)
    .filter((value): value is Types.ObjectId => value != null);

  if (!objectIds.length) return;

  const users = await UserModel.find(
    { _id: { $in: objectIds } } as any,
    { 'progression.xp_total': 1 },
  ).lean();

  if (!users.length) return;

  await Promise.all(
    users.map((user) =>
      UserModel.updateOne(
        { _id: user._id } as any,
        {
          $set: {
            'progression.level': getLevelFromXp(user.progression?.xp_total ?? 0),
          },
        } as any,
      ),
    ),
  );
}

export async function reserveCoinsForJoin(userId: string, amount: number) {
  const objectId = toObjectId(userId);
  if (!objectId || amount <= 0) return;
  const user = await UserModel.findOneAndUpdate(
    {
      _id: objectId,
      is_active: true,
      $expr: {
        $gte: [{ $subtract: ['$wallet.coins_balance', '$wallet.coins_reserved'] }, amount],
      },
    } as any,
    {
      $inc: {
        'wallet.coins_reserved': amount,
      },
    } as any,
    { returnDocument: 'after' },
  );

  if (!user) {
    throw createConflictError(
      'Not enough available coins to join this room.',
      'insufficient_coins',
    );
  }
}

export async function releaseReservedCoins(players: EconomyPlayer[]) {
  const reservationOps = players
    .filter((player) => player.user_id && !player.is_bot && (player.coins?.reserved ?? 0) > 0)
    .map((player) => ({
      updateOne: {
        filter: { _id: player.user_id },
        update: [
          {
            $set: {
              'wallet.coins_reserved': buildReservedCoinsClampUpdate(player.coins?.reserved ?? 0),
            },
          },
        ],
      },
    }));

  if (!reservationOps.length) return;
  await UserModel.bulkWrite(reservationOps as any);
}

export async function settleCompletedEconomy(game: EconomyGame, players: EconomyPlayer[], winnerSeatId?: string) {
  const stake = getStake(game);
  const botReward = getBotReward(game);
  const settledAt = new Date();
  const humanPlayers = players.filter((player) => player.user_id && !player.is_bot);
  const botCount = players.filter((player) => player.is_bot).length;
  const winner = players.find((player) => player.player_id === winnerSeatId);
  const humanWinner = winner && !winner.is_bot && winner.user_id ? winner : null;
  const humanLoserCount = humanWinner
    ? humanPlayers.filter((player) => player.player_id !== humanWinner.player_id).length
    : humanPlayers.length;
  const humanPot = humanPlayers.length * stake;
  const botBonus = humanWinner ? botCount * botReward : 0;

  const updatedPlayers = players.map((player) => {
    if (player.is_bot || !player.user_id) {
      return {
        ...player,
        coins: {
          reserved: 0,
          delta: player.coins?.delta ?? 0,
        },
        xp: {
          delta: 0,
        },
      };
    }

    const isWinner = Boolean(humanWinner && player.player_id === humanWinner.player_id);
    const coinDelta = isWinner
      ? humanLoserCount * stake + botBonus
      : -stake;
    const xpDelta = isWinner ? XP_WIN : XP_LOSS;

    return {
      ...player,
      coins: {
        reserved: 0,
        delta: coinDelta,
      },
      xp: {
        delta: xpDelta,
      },
    };
  });

  const settlementOps = updatedPlayers
    .filter((player) => player.user_id && !player.is_bot)
    .map((player) => {
      const originalPlayer = players.find((entry) => entry.player_id === player.player_id);
      const reservedAmount = originalPlayer?.coins?.reserved ?? 0;
      return {
        updateOne: {
          filter: { _id: player.user_id },
          update: [
            {
              $set: {
                'wallet.coins_balance': {
                  $add: ['$wallet.coins_balance', player.coins?.delta ?? 0],
                },
                'wallet.coins_reserved': buildReservedCoinsClampUpdate(reservedAmount),
                'progression.xp_total': {
                  $add: ['$progression.xp_total', player.xp?.delta ?? 0],
                },
              },
            },
          ],
        },
      };
    });

  if (settlementOps.length) {
    await UserModel.bulkWrite(settlementOps as any);
    await syncUserLevels(
      updatedPlayers
        .filter((player) => player.user_id && !player.is_bot)
        .map((player) => String(player.user_id)),
    );
  }

  return {
    players: updatedPlayers,
    coin_settlement: {
      status: 'completed' as const,
      settled_at: settledAt,
      human_player_count: humanPlayers.length,
      bot_count: botCount,
      human_pot: humanPot,
      bot_bonus: botBonus,
    },
    xp_settlement: {
      status: 'completed' as const,
      settled_at: settledAt,
    },
  };
}

export async function voidEconomySettlement(game: EconomyGame, players: EconomyPlayer[]) {
  const settledAt = new Date();
  const stake = getStake(game);
  const botCount = players.filter((player) => player.is_bot).length;
  const humanPlayers = players.filter((player) => player.user_id && !player.is_bot);

  await releaseReservedCoins(players);

  return {
    players: players.map((player) => ({
      ...player,
      coins: {
        reserved: 0,
        delta: player.coins?.delta ?? 0,
      },
      xp: {
        delta: player.xp?.delta ?? 0,
      },
    })),
    coin_settlement: {
      status: 'void' as const,
      settled_at: settledAt,
      human_player_count: humanPlayers.length,
      bot_count: botCount,
      human_pot: humanPlayers.length * stake,
      bot_bonus: 0,
    },
    xp_settlement: {
      status: 'void' as const,
      settled_at: settledAt,
    },
  };
}
