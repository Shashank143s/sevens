import { listRooms } from '../services/room-list.service';
import type { ApiRouteContext, RouteNext } from '../types/route.types';
import { setJson } from '../utils/http.util';

function isRoomsPath(ctx: ApiRouteContext) {
  return ctx.path === '/api/rooms';
}

export async function roomsRoute(ctx: ApiRouteContext, next: RouteNext): Promise<void> {
  if (!isRoomsPath(ctx)) return next();
  if (ctx.method !== 'GET') return setJson(ctx, 405, { error: 'Method not allowed' });

  try {
    setJson(ctx, 200, { rooms: await listRooms() });
  } catch (error) {
    console.error('[rooms-route] Error:', error);
    setJson(ctx, 500, { error: 'Failed to load rooms' });
  }
}
