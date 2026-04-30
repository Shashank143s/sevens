import {
  CRAWLER_LOGIN_PASSWORD,
  CRAWLER_LOGIN_USERNAME,
  CRAWLER_SESSION_COOKIE_DOMAIN,
  CRAWLER_SESSION_MAX_AGE_SECONDS,
  CRAWLER_SESSION_SECRET,
} from '../config';
import { timingSafeEqual } from 'crypto';
import { readJsonBody } from '../utils/common.util';
import { setJson } from '../utils/http.util';
import { buildSignedSessionCookieHeader, createSignedSessionCookie } from '../utils/session-cookie.util';
import type { ApiRouteContext, RouteNext } from '../types/route.types';

const LOGIN_COOKIE_NAME = 'user_session';

function matchLoginPath(ctx: ApiRouteContext) {
  return ctx.path === '/api/login';
}

function isConfigured() {
  return Boolean(CRAWLER_LOGIN_USERNAME && CRAWLER_LOGIN_PASSWORD && CRAWLER_SESSION_SECRET);
}

function compareSecret(actual: string, expected: string) {
  if (actual.length !== expected.length) return false;
  const actualBytes = Buffer.from(actual, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return timingSafeEqual(actualBytes, expectedBytes);
}

async function handleLogin(ctx: ApiRouteContext) {
  if (!isConfigured()) {
    return setJson(ctx, 503, { error: 'Crawler login is not configured' });
  }

  const payload = (await readJsonBody(ctx)) as { username?: string; password?: string };
  const username = payload.username?.trim() ?? '';
  const password = payload.password?.trim() ?? '';

  if (!username || !password) {
    return setJson(ctx, 400, { error: 'Missing username or password' });
  }

  const usernameOk = compareSecret(username, CRAWLER_LOGIN_USERNAME);
  const passwordOk = compareSecret(password, CRAWLER_LOGIN_PASSWORD);

  if (!usernameOk || !passwordOk) {
    return setJson(ctx, 401, { error: 'Invalid credentials' });
  }
  const session = createSignedSessionCookie(username, CRAWLER_SESSION_SECRET, CRAWLER_SESSION_MAX_AGE_SECONDS);
  ctx.set('Set-Cookie', buildSignedSessionCookieHeader(LOGIN_COOKIE_NAME, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CRAWLER_SESSION_MAX_AGE_SECONDS,
    ...(CRAWLER_SESSION_COOKIE_DOMAIN ? { domain: CRAWLER_SESSION_COOKIE_DOMAIN } : {}),
  }));

  return setJson(ctx, 200, {
    ok: true,
    expires_at: new Date(session.expiresAt).toISOString(),
  });
}

export async function loginRoute(ctx: ApiRouteContext, next: RouteNext): Promise<void> {
  if (!matchLoginPath(ctx)) return next();

  try {
    if (ctx.method !== 'POST') {
      return setJson(ctx, 405, { error: 'Method not allowed' });
    }

    await handleLogin(ctx);
  } catch (error) {
    console.error('[login-route] Error:', error);
    setJson(ctx, 500, { error: 'Internal server error' });
  }
}
