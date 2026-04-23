import {
  authorizeGameJoin,
  createGameRecord,
  getGameRecord,
  getPublicGameRecord,
  updateGameRecord,
} from '../services/game-record.service';
import { fetchGameDetails, joinGame } from '../services/game.service';
import type { CreateGamePayload, JoinAuthorizationPayload, UpdateGamePayload } from '../types/game-record.types';
import type { GameRouteContext, RouteNext } from '../types/route.types';
import type { JoinGamePayload, JoinGameResponse } from '../types/service.types';
import { readJsonBody } from '../utils/common.util';
import { setJson } from '../utils/http.util';

function matchGamePath(ctx: GameRouteContext) {
  return ctx.path.match(/^\/api\/game\/([^/]+)$/);
}

function matchAuthorizeJoinPath(ctx: GameRouteContext) {
  return ctx.path.match(/^\/api\/game\/([^/]+)\/authorize-join$/);
}

function matchJoinPath(ctx: GameRouteContext) {
  return ctx.path.match(/^\/api\/game\/([^/]+)\/join$/);
}

async function handleGet(ctx: GameRouteContext, matchID: string) {
  const game = await getPublicGameRecord(matchID);
  if (!game) return setJson(ctx, 404, { error: 'Game not found' });
  setJson(ctx, 200, { game: game as Record<string, unknown> });
}

async function handlePost(ctx: GameRouteContext, matchID: string) {
  const payload = (await readJsonBody(ctx)) as CreateGamePayload;
  const game = await createGameRecord(matchID, payload);
  setJson(ctx, 200, { game: game.toObject() as Record<string, unknown> });
}

async function handlePut(ctx: GameRouteContext, matchID: string) {
  const payload = (await readJsonBody(ctx)) as UpdateGamePayload;
  const game = await updateGameRecord(matchID, payload);
  if (!game) return setJson(ctx, 404, { error: 'Game not found' });
  setJson(ctx, 200, { game: game as Record<string, unknown> });
}

function logGamePutTiming(matchID: string, startedAt: bigint, status?: number) {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  console.log(
    `[game-route] PUT /api/game/${matchID} status=${status ?? 'unknown'} duration=${durationMs.toFixed(1)}ms`,
  );
}

async function handleAuthorizeJoin(ctx: GameRouteContext, matchID: string) {
  if (ctx.method !== 'POST') return setJson(ctx, 405, { error: 'Method not allowed' });
  const payload = (await readJsonBody(ctx)) as JoinAuthorizationPayload;
  const result = await authorizeGameJoin(matchID, payload.password, payload.user_id);
  if (!result) return setJson(ctx, 404, { error: 'Game not found' });
  if (result.already_joined) {
    return setJson(ctx, 409, {
      error: 'You already joined this table. Please rejoin from lobby.',
      reason: 'already_joined',
      player_id: result.player_id,
    });
  }
  if (!result.allowed) return setJson(ctx, 403, { error: 'Incorrect room password' });
  return setJson(ctx, 200, { allowed: true });
}

function getBoardPlayerUserId(player: { data?: Record<string, unknown> }) {
  const data = player.data ?? {};
  const userId = data.userId ?? data.user_id ?? data.userID;
  return typeof userId === 'string' ? userId : '';
}

async function handleJoin(ctx: GameRouteContext, matchID: string) {
  if (ctx.method !== 'POST') return setJson(ctx, 405, { error: 'Method not allowed' });

  const payload = (await readJsonBody(ctx)) as JoinGamePayload & {
    password?: string;
    user_id?: string;
  };
  const playerName = String(payload.playerName ?? '').trim();
  const userId = String(payload.user_id ?? '').trim();

  if (!playerName) {
    return setJson(ctx, 400, { error: 'playerName is required' });
  }

  const auth = await authorizeGameJoin(matchID, payload.password, userId || undefined);
  if (!auth) return setJson(ctx, 404, { error: 'Game not found' });
  if (!auth.allowed && !auth.already_joined) {
    return setJson(ctx, 403, { error: 'Incorrect room password' });
  }

  const gameRes = await fetchGameDetails(matchID);
  if (!gameRes.ok) {
    return setJson(ctx, gameRes.status === 404 ? 404 : 502, { error: 'Match not found' });
  }

  const game = (await gameRes.json()) as {
    players?: Array<{
      id: number;
      name?: string | null;
      data?: Record<string, unknown>;
    }>;
  };

  const players = game.players ?? [];
  const existingBoardSeat = userId
    ? players.find((player) => getBoardPlayerUserId(player) === userId)
    : undefined;
  const existingDbSeat = userId
    ? (await getGameRecord(matchID))?.players?.find((player) => (
      !player.is_bot
      && !player.left_at
      && player.user_id
      && String(player.user_id) === userId
    ))
    : undefined;

  const targetPlayerID = existingBoardSeat?.id != null
    ? String(existingBoardSeat.id)
    : existingDbSeat?.player_id
      ?? String(players.find((player) => player.name == null || player.name === '')?.id ?? '');

  if (!targetPlayerID) {
    return setJson(ctx, 400, { error: 'This room is full.' });
  }

  const joinRes = await joinGame(matchID, {
    playerID: targetPlayerID,
    playerName,
    data: {
      ...(payload.data ?? {}),
      userId: userId || undefined,
      displayName: playerName,
    },
  });

  if (!joinRes.ok) {
    const text = await joinRes.text();
    console.error('[game-route] Join failed:', joinRes.status, text);
    return setJson(ctx, 502, { error: 'Failed to join room' });
  }

  const joinData = (await joinRes.json()) as JoinGameResponse;
  await updateGameRecord(matchID, {
    joined_player: {
      user_id: userId || undefined,
      player_id: joinData.playerID,
      display_name: playerName,
      is_bot: false,
      joined_at: new Date().toISOString(),
    },
  });
  return setJson(ctx, 200, joinData);
}

async function dispatchGameRoute(ctx: GameRouteContext, matchID: string) {
  if (ctx.method === 'GET') return handleGet(ctx, matchID);
  if (ctx.method === 'POST') return handlePost(ctx, matchID);
  if (ctx.method === 'PUT') return handlePut(ctx, matchID);
  return null;
}

export async function gameRoute(ctx: GameRouteContext, next: RouteNext): Promise<void> {
  const joinMatch = matchJoinPath(ctx);
  if (joinMatch) {
    try {
      await handleJoin(ctx, joinMatch[1]);
    } catch (error) {
      if ((error as { status?: number }).status === 409) {
        return setJson(ctx, 409, {
          error: (error as Error).message,
          reason: (error as { reason?: string }).reason ?? 'conflict',
        });
      }
      console.error('[game-route] Error:', error);
      setJson(ctx, 500, { error: 'Internal server error' });
    }
    return;
  }

  const authorizeMatch = matchAuthorizeJoinPath(ctx);
  if (authorizeMatch) {
    try {
      await handleAuthorizeJoin(ctx, authorizeMatch[1]);
    } catch (error) {
      if ((error as { status?: number }).status === 409) {
        return setJson(ctx, 409, {
          error: (error as Error).message,
          reason: (error as { reason?: string }).reason ?? 'conflict',
        });
      }
      console.error('[game-route] Error:', error);
      setJson(ctx, 500, { error: 'Internal server error' });
    }
    return;
  }

  const match = matchGamePath(ctx);
  if (!match) return next();

  const putStartedAt = ctx.method === 'PUT' ? process.hrtime.bigint() : null;
  try {
    await dispatchGameRoute(ctx, match[1]);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('room name')) {
      return setJson(ctx, 400, { error: error.message });
    }
    if ((error as { status?: number }).status === 409) {
      return setJson(ctx, 409, {
        error: (error as Error).message,
        reason: (error as { reason?: string }).reason ?? 'conflict',
      });
    }
    console.error('[game-route] Error:', error);
    setJson(ctx, 500, { error: 'Internal server error' });
  } finally {
    if (putStartedAt) {
      logGamePutTiming(match[1], putStartedAt, ctx.status);
    }
  }
}
