import { CRAWLER_SESSION_SECRET } from '../config';
import { setJson } from '../utils/http.util';
import { verifySignedSessionCookie } from '../utils/session-cookie.util';
import type { ApiRouteContext, RouteNext } from '../types/route.types';

const SESSION_COOKIE_NAME = 'user_session';

function matchSessionPath(ctx: ApiRouteContext) {
  return ctx.path === '/api/session';
}

function parseCookies(header: string) {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const index = part.indexOf('=');
      if (index <= 0) return cookies;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function verifySessionCookie(cookieHeader: string) {
  if (!CRAWLER_SESSION_SECRET) return null;
  const cookies = parseCookies(cookieHeader);
  const cookieValue = cookies[SESSION_COOKIE_NAME];
  if (!cookieValue) return null;
  return verifySignedSessionCookie(cookieValue, CRAWLER_SESSION_SECRET);
}

async function handleSession(ctx: ApiRouteContext) {
  const cookieHeader = ctx.get('Cookie') || ctx.get('cookie') || '';
  const session = verifySessionCookie(cookieHeader);

  if (!session) {
    return setJson(ctx, 401, { authenticated: false });
  }

  return setJson(ctx, 200, {
    authenticated: true,
    subject: session.sub,
    expires_at: new Date(session.exp * 1000).toISOString(),
  });
}

export async function sessionRoute(ctx: ApiRouteContext, next: RouteNext): Promise<void> {
  if (!matchSessionPath(ctx)) return next();

  try {
    if (ctx.method !== 'GET') {
      return setJson(ctx, 405, { error: 'Method not allowed' });
    }

    await handleSession(ctx);
  } catch (error) {
    console.error('[session-route] Error:', error);
    setJson(ctx, 500, { error: 'Internal server error' });
  }
}
