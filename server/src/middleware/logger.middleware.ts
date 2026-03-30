import type { LoggerContext, MiddlewareNext } from '../types/middleware.types';

export async function loggerMiddleware(ctx: LoggerContext, next: MiddlewareNext): Promise<void> {
  await next();

  if (ctx.method === 'POST' && ctx.path === '/games/sevens/create' && ctx.status === 200) {
    console.log('🪄 Room created:', ctx.body?.matchID ?? '(unknown matchID)');
    return;
  }

  if (
    ctx.method === 'POST' &&
    ctx.path.startsWith('/games/sevens/') &&
    ctx.path.endsWith('/join') &&
    ctx.status === 200
  ) {
    const matchID = ctx.path.split('/')[3];
    console.log('🙋 Player joined room:', matchID, 'as player', ctx.body?.playerID ?? '(unknown)');
    return;
  }

  if (
    ctx.method === 'POST' &&
    ctx.path.startsWith('/games/sevens/') &&
    ctx.path.endsWith('/leave') &&
    ctx.status === 200
  ) {
    const matchID = ctx.path.split('/')[3];
    console.log(
      '👋 Player left room:',
      matchID,
      'player',
      ctx.request?.body?.playerID ?? '(unknown)',
    );
  }
}
