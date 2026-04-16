import {
  ANDROID_LATEST_VERSION_CODE,
  ANDROID_MIN_SUPPORTED_VERSION_CODE,
  ANDROID_UPDATE_MESSAGE,
  ANDROID_UPDATE_MODE,
} from '../config';
import type { ApiRouteContext, RouteNext } from '../types/route.types';
import { setJson } from '../utils/http.util';

function isVersionPolicyPath(ctx: ApiRouteContext) {
  return ctx.path === '/api/app/version-policy';
}

export async function appRoute(ctx: ApiRouteContext, next: RouteNext): Promise<void> {
  if (!isVersionPolicyPath(ctx)) return next();
  if (ctx.method !== 'GET') return setJson(ctx, 405, { error: 'Method not allowed' });

  const platform = String((ctx as any).query?.platform ?? 'android').trim().toLowerCase();

  if (platform !== 'android') {
    return setJson(ctx, 200, {
      platform,
      latest_version_code: 0,
      min_supported_version_code: 0,
      update_mode: 'flexible',
      message: '',
    });
  }

  return setJson(ctx, 200, {
    platform: 'android',
    latest_version_code: Math.max(0, ANDROID_LATEST_VERSION_CODE),
    min_supported_version_code: Math.max(0, ANDROID_MIN_SUPPORTED_VERSION_CODE),
    update_mode: ANDROID_UPDATE_MODE,
    message: ANDROID_UPDATE_MESSAGE,
  });
}
