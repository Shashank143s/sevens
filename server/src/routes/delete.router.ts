import type {
  DeleteRouteContext,
  DeleteRouteServer,
  RouteNext,
} from '../types/route.types';

export function createDeleteRoute(server: DeleteRouteServer) {
  return async function deleteRoute(ctx: DeleteRouteContext, next: RouteNext): Promise<void> {
    const match = ctx.path.match(/^\/api\/match\/delete\/([^/]+)$/);
    if (ctx.method !== 'POST' || !match) {
      await next();
      return;
    }

    const matchID = match[1];

    try {
      await server.db.wipe(matchID);
      server.transport?.deleteMatchQueue?.(matchID);
      ctx.status = 200;
      ctx.body = { deleted: true };
    } catch (error) {
      console.error('[delete-match] Error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Failed to delete match' };
    }
  };
}
