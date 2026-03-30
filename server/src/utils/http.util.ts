type ResponseContext = {
  status: number;
  body?: unknown;
};

export function matchRoute(path: string, method: string, expectedMethod: string, pattern: RegExp) {
  if (method !== expectedMethod) {
    return null;
  }

  return path.match(pattern);
}

export function setJson(ctx: ResponseContext, status: number, body: Record<string, unknown>) {
  ctx.status = status;
  ctx.body = body;
}
