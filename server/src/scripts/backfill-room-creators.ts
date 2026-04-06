import { disconnect, Types } from 'mongoose';
import { connectToDatabase } from '../database/mongoose';
import { GameModel, UserModel } from '../models';

type GameStub = {
  _id: Types.ObjectId;
  creator_user_id?: Types.ObjectId | null;
};

type UserStub = {
  _id: Types.ObjectId;
  full_name?: string | null;
  first_name?: string | null;
};

function hasValidName(value?: string | null) {
  return Boolean(value?.trim());
}

async function run() {
  const startedAt = Date.now();
  await connectToDatabase();

  const games = await GameModel.find(
    {
      creator_user_id: { $exists: true, $ne: null },
      $or: [
        { creator_display_name: { $exists: false } },
        { creator_display_name: null },
        { creator_display_name: '' },
      ],
    } as any,
    {
      _id: 1,
      creator_user_id: 1,
    } as any,
  ).lean<GameStub[]>();

  if (games.length === 0) {
    console.log('[backfill-room-creators] No rooms require backfill.');
    return;
  }

  const creatorIDs = Array.from(
    new Set(
      games
        .map((game) => game.creator_user_id?.toString())
        .filter((value): value is string => Boolean(value)),
    ),
  ).map((value) => new Types.ObjectId(value));

  const users = await UserModel.find(
    { _id: { $in: creatorIDs } } as any,
    { full_name: 1, first_name: 1 } as any,
  ).lean<UserStub[]>();

  const userNameMap = new Map(
    users
      .map((user) => {
        const displayName = user.full_name?.trim() || user.first_name?.trim() || '';
        return [user._id.toString(), displayName] as const;
      })
      .filter((entry) => hasValidName(entry[1])),
  );

  const operations = games
    .map((game) => {
      const creatorID = game.creator_user_id?.toString();
      const creatorDisplayName = creatorID ? userNameMap.get(creatorID) : undefined;
      if (!hasValidName(creatorDisplayName)) return null;
      return {
        updateOne: {
          filter: { _id: game._id },
          update: {
            $set: {
              creator_display_name: creatorDisplayName,
            },
          },
        },
      };
    })
    .filter((operation): operation is NonNullable<typeof operation> => Boolean(operation));

  if (operations.length === 0) {
    console.log('[backfill-room-creators] No matching creator names found for rooms needing backfill.');
    return;
  }

  const result = await GameModel.bulkWrite(operations as any, { ordered: false });

  console.log(
    `[backfill-room-creators] Matched ${games.length} room(s), updated ${result.modifiedCount} room(s) in ${Date.now() - startedAt}ms.`,
  );
}

run()
  .catch((error) => {
    console.error('[backfill-room-creators] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnect().catch(() => undefined);
  });
