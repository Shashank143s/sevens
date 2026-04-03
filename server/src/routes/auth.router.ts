import { signInWithGoogleIdToken } from '../services/google-auth.service';
import type { GoogleSignInPayload } from '../types/account.types';
import type { AuthRouteContext, RouteNext } from '../types/route.types';
import { readJsonBody } from '../utils/common.util';
import { setJson } from '../utils/http.util';

function matchGoogleSignInPath(ctx: AuthRouteContext) {
  return ctx.path === '/api/auth/google/sign-in';
}

async function handleGoogleSignIn(ctx: AuthRouteContext) {
  const payload = (await readJsonBody(ctx)) as GoogleSignInPayload;
  const credential = payload.credential?.trim();

  if (!credential) {
    return setJson(ctx, 400, { error: 'Missing Google credential' });
  }

  const user = await signInWithGoogleIdToken(
    credential,
    payload.legal_accepted_at,
    ctx.state?.geo,
  );

  return setJson(ctx, 200, {
    user: user?.toObject() as Record<string, unknown>,
  });
}

export async function authRoute(ctx: AuthRouteContext, next: RouteNext): Promise<void> {
  if (!matchGoogleSignInPath(ctx)) return next();

  try {
    if (ctx.method !== 'POST') {
      return setJson(ctx, 405, { error: 'Method not allowed' });
    }

    // Native app sign-in posts a Google ID token here so the backend can verify it
    // and sync the Sevens account before the app stores its local session.
    await handleGoogleSignIn(ctx);
  } catch (error) {
    console.error('[auth-route] Error:', error);
    setJson(ctx, 500, { error: 'Internal server error' });
  }
}
