import { deleteAccountByIdentifier, getAccountByIdentifier, upsertAccountByIdentifier } from '../services/account.service';
import type { AccountPayload } from '../types/account.types';
import type { AccountRouteContext, RouteNext } from '../types/route.types';
import { matchRoute, setJson } from '../utils/http.util';
import { readJsonBody } from '../utils/common.util';

function matchAccountPath(ctx: AccountRouteContext) {
  return ctx.path.match(/^\/api\/account\/([^/]+)$/);
}

function readPagination(ctx: AccountRouteContext) {
  const query = (ctx as any).query ?? {};
  return {
    offset: Number(query.offset ?? 0),
    limit: Number(query.limit ?? 5),
  };
}

async function handleGet(ctx: AccountRouteContext, userID: string) {
  const { offset, limit } = readPagination(ctx);
  const account = await getAccountByIdentifier(userID, offset, limit);
  if (!account) return setJson(ctx, 404, { error: 'Account not found' });
  setJson(ctx, 200, account as Record<string, unknown>);
}

async function handlePost(ctx: AccountRouteContext, userID: string) {
  const payload = (await readJsonBody(ctx)) as AccountPayload;
  const account = await upsertAccountByIdentifier(userID, payload);
  setJson(ctx, 200, { user: account?.toObject() as Record<string, unknown> });
}

async function handleDelete(ctx: AccountRouteContext, userID: string) {
  const account = await deleteAccountByIdentifier(userID);
  if (!account) return setJson(ctx, 404, { error: 'Account not found' });
  setJson(ctx, 200, { deleted: true });
}

async function dispatchAccountRoute(ctx: AccountRouteContext, userID: string) {
  if (matchRoute(ctx.path, ctx.method, 'GET', /^\/api\/account\/([^/]+)$/)) return handleGet(ctx, userID);
  if (matchRoute(ctx.path, ctx.method, 'POST', /^\/api\/account\/([^/]+)$/)) return handlePost(ctx, userID);
  if (matchRoute(ctx.path, ctx.method, 'DELETE', /^\/api\/account\/([^/]+)$/)) return handleDelete(ctx, userID);
  return null;
}

export async function accountRoute(ctx: AccountRouteContext, next: RouteNext): Promise<void> {
  const match = matchAccountPath(ctx);
  if (!match) return next();

  try {
    await dispatchAccountRoute(ctx, match[1]);
  } catch (error) {
    console.error('[account-route] Error:', error);
    setJson(ctx, 500, { error: 'Internal server error' });
  }
}
