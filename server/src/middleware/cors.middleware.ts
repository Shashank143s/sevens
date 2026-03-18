import { FRONTEND_ORIGIN_REGEX, FRONTEND_ORIGIN } from '../config';
import type { CorsContext, MiddlewareNext } from '../types/middleware.types';

export async function corsMiddleware(ctx: CorsContext, next: MiddlewareNext): Promise<void> {
  const origin = ctx.get('Origin');
  const originRegex = new RegExp(FRONTEND_ORIGIN_REGEX);
  const allowOrigin = origin && originRegex.test(origin) ? origin : FRONTEND_ORIGIN;

  ctx.set('Access-Control-Allow-Origin', allowOrigin);
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  ctx.set('Access-Control-Allow-Credentials', 'true');

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }

  await next();
}
