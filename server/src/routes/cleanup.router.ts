import { CLEANUP_CRON_SECRET } from '../config';
import { cleanupStaleRooms } from '../services/stale-room-cleanup.service';
import type { CleanupRouteContext, CleanupRouteServer, RouteNext } from '../types/route.types';
import { setJson } from '../utils/http.util';

function isCleanupRequest(ctx: CleanupRouteContext) {
  return ctx.method === 'POST' && ctx.path === '/api/cleanup/stale-rooms';
}

function readBearerToken(ctx: CleanupRouteContext) {
  const headerValue = (ctx.headers?.authorization ?? ctx.headers?.Authorization) as string | undefined;
  if (!headerValue) return '';
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? '';
}

function isAuthorizedCleanupRequest(ctx: CleanupRouteContext) {
  if (!CLEANUP_CRON_SECRET) return false;
  return readBearerToken(ctx) === CLEANUP_CRON_SECRET;
}

export function createCleanupRoute(server: CleanupRouteServer) {
  return async function cleanupRoute(ctx: CleanupRouteContext, next: RouteNext): Promise<void> {
    if (!isCleanupRequest(ctx)) {
      await next();
      return;
    }

    if (!isAuthorizedCleanupRequest(ctx)) {
      return setJson(ctx, 401, { error: 'Unauthorized cleanup request' });
    }

    try {
      // External scheduler endpoint for retiring stale rooms and refunding reserved coins.
      const result = await cleanupStaleRooms(async (matchID: string) => {
        await server.db.wipe(matchID);
        server.transport?.deleteMatchQueue?.(matchID);
      });

      return setJson(ctx, 200, {
        ok: true,
        ...result,
      });
    } catch (error) {
      console.error('[cleanup-route] Error:', error);
      return setJson(ctx, 500, { error: 'Failed to cleanup stale rooms' });
    }
  };
}
