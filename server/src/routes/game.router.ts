import { createGameRecord, getGameRecord, updateGameRecord } from '../services/game-record.service';
import type { CreateGamePayload, UpdateGamePayload } from '../types/game-record.types';
import type { GameRouteContext, RouteNext } from '../types/route.types';
import { readJsonBody } from '../utils/common.util';
import { setJson } from '../utils/http.util';

function matchGamePath(ctx: GameRouteContext) {
  return ctx.path.match(/^\/api\/game\/([^/]+)$/);
}

async function handleGet(ctx: GameRouteContext, matchID: string) {
  const game = await getGameRecord(matchID);
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

async function dispatchGameRoute(ctx: GameRouteContext, matchID: string) {
  if (ctx.method === 'GET') return handleGet(ctx, matchID);
  if (ctx.method === 'POST') return handlePost(ctx, matchID);
  if (ctx.method === 'PUT') return handlePut(ctx, matchID);
  return null;
}

export async function gameRoute(ctx: GameRouteContext, next: RouteNext): Promise<void> {
  const match = matchGamePath(ctx);
  if (!match) return next();

  try {
    await dispatchGameRoute(ctx, match[1]);
  } catch (error) {
    if ((error as { status?: number }).status === 409) {
      return setJson(ctx, 409, {
        error: (error as Error).message,
        reason: (error as { reason?: string }).reason ?? 'limit_breached',
      });
    }
    console.error('[game-route] Error:', error);
    setJson(ctx, 500, { error: 'Internal server error' });
  }
}
