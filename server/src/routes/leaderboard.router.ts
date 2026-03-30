import { getLeaderboard } from '../services/account.service';
import type { ApiRouteContext, RouteNext } from '../types/route.types';
import { setJson } from '../utils/http.util';

function matchLeaderboardPath(ctx: ApiRouteContext) {
  return ctx.path.match(/^\/api\/leaderboard$/);
}

export async function leaderboardRoute(ctx: ApiRouteContext, next: RouteNext): Promise<void> {
  if (!matchLeaderboardPath(ctx)) return next();
  if (ctx.method !== 'GET') {
    return setJson(ctx, 405, { error: 'Method not allowed' });
  }

  try {
    const query = (ctx as any).query ?? {};
    const limit = Number(query.limit ?? 25);
    const identifier = typeof query.user_id === 'string' ? query.user_id.trim() : '';
    const leaderboard = await getLeaderboard(limit, identifier || undefined);
    setJson(ctx, 200, leaderboard as Record<string, unknown>);
  } catch (error) {
    console.error('[leaderboard-route] Error:', error);
    setJson(ctx, 500, { error: 'Internal server error' });
  }
}
