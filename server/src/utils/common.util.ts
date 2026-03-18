import type { JsonBodyContext } from '../types/common.types';

export async function readJsonBody(ctx: JsonBodyContext): Promise<Record<string, unknown>> {
  if (ctx.request.body != null && typeof ctx.request.body === 'object') {
    return ctx.request.body as Record<string, unknown>;
  }

  const req = ctx.request.req as NodeJS.ReadableStream & { body?: unknown };
  if (req.body != null && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }

  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk: Buffer | string) => {
      data += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}
