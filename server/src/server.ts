import { Server, Origins } from 'boardgame.io/server';
import { Sevens } from './game';
import { runBot } from './botRunner';

const server = Server({
  games: [Sevens],
  origins: [Origins.LOCALHOST],
});

const API_BASE = 'https://sevens-ukxv.onrender.com';

/** Read JSON body for a Koa request */
async function readJsonBody(ctx: { request: { body?: unknown; req: NodeJS.ReadableStream } }): Promise<Record<string, unknown>> {
  if (ctx.request.body != null && typeof ctx.request.body === 'object') {
    return ctx.request.body as Record<string, unknown>;
  }
  const req = ctx.request.req as NodeJS.ReadableStream & { body?: unknown };
  if (req.body != null && typeof req.body === 'object') return req.body as Record<string, unknown>;
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer | string) => { data += chunk.toString(); });
    req.on('end', () => {
      try { resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/** CORS for custom API routes (boardgame.io CORS runs only after configureApp in run(); our route runs before that) */
server.app.use(async (ctx: any, next: () => Promise<void>) => {
  const origin = ctx.get('Origin');
  const allowOrigin = origin && /^https?:\/\/localhost(:\d+)?$/.test(origin) ? origin : 'http://localhost:3000';
  ctx.set('Access-Control-Allow-Origin', allowOrigin);
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }
  await next();
});

/** POST /api/bot/join/:matchID — join bot players and start bot runner (avoids conflict with boardgame.io routes) */
server.app.use(async (ctx: any, next: () => Promise<void>) => {
  const match = ctx.path.match(/^\/api\/bot\/join\/([^/]+)$/);
  if (ctx.method !== 'POST' || !match) {
    await next();
    return;
  }
  const matchID = match[1];
  try {
    const body = await readJsonBody(ctx);
    const aiBots = Number(body?.aiBots ?? 0);
    if (aiBots < 1 || !Number.isInteger(aiBots)) {
      ctx.status = 400;
      ctx.body = { error: 'aiBots must be a positive integer' };
      return;
    }
    const metaRes = await fetch(`${API_BASE}/games/sevens/${matchID}`);
    if (!metaRes.ok) {
      ctx.status = metaRes.status;
      ctx.body = { error: 'Match not found' };
      return;
    }
    const meta = await metaRes.json() as { players?: { id: number; name?: string | null }[] };
    const players = meta.players ?? [];
    const numPlayers = players.length;
    const emptySlots = players
      .map((p, i) => ({ id: i, name: p.name }))
      .filter((p) => p.name == null || p.name === '');
    const botsToJoin = Math.min(aiBots, emptySlots.length);
    if (botsToJoin === 0) {
      ctx.status = 400;
      ctx.body = { error: 'No empty slots for bots' };
      return;
    }
    for (let i = 0; i < botsToJoin; i++) {
      const slot = emptySlots[i];
      const joinRes = await fetch(`${API_BASE}/games/sevens/${matchID}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerID: String(slot.id),
          playerName: `Bot ${i + 1}`,
          data: {},
        }),
      });
      if (!joinRes.ok) {
        const text = await joinRes.text();
        console.error('[join-bots] Join failed:', joinRes.status, text);
        ctx.status = 502;
        ctx.body = { error: 'Failed to join bot' };
        return;
      }
      const joinData = await joinRes.json() as { playerID: string; playerCredentials: string };
      runBot(matchID, joinData.playerID, joinData.playerCredentials);
    }
    ctx.status = 200;
    ctx.body = { joined: botsToJoin };
  } catch (err) {
    console.error('[join-bots] Error:', err);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
});

/** POST /api/match/delete/:matchID — wipe a match from the server DB (removes room from lobby). */
server.app.use(async (ctx: any, next: () => Promise<void>) => {
  const match = ctx.path.match(/^\/api\/match\/delete\/([^/]+)$/);
  if (ctx.method !== 'POST' || !match) {
    await next();
    return;
  }
  const matchID = match[1];
  try {
    await server.db.wipe(matchID);
    // Best-effort cleanup of any per-match transport queue.
    (server.transport as any)?.deleteMatchQueue?.(matchID);
    ctx.status = 200;
    ctx.body = { deleted: true };
  } catch (err) {
    console.error('[delete-match] Error:', err);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete match' };
  }
});

// Simple logging middleware for lobby actions
server.app.use(async (ctx, next) => {
  await next();

  // Log room creation
  if (ctx.method === 'POST' && ctx.path === '/games/sevens/create' && ctx.status === 200) {
    const body = ctx.body as { matchID?: string } | undefined;
    console.log('🪄 Room created:', body?.matchID ?? '(unknown matchID)');
  }

  // Log player joining a room
  if (
    ctx.method === 'POST' &&
    ctx.path.startsWith('/games/sevens/') &&
    ctx.path.endsWith('/join') &&
    ctx.status === 200
  ) {
    const segments = ctx.path.split('/');
    const matchID = segments[3];
    const body = ctx.body as { playerID?: string } | undefined;
    console.log('🙋 Player joined room:', matchID, 'as player', body?.playerID ?? '(unknown)');
  }

  // Log player leaving a room
  if (
    ctx.method === 'POST' &&
    ctx.path.startsWith('/games/sevens/') &&
    ctx.path.endsWith('/leave') &&
    ctx.status === 200
  ) {
    const segments = ctx.path.split('/');
    const matchID = segments[3];
    const body = ctx.request as any;
    console.log(
      '👋 Player left room:',
      matchID,
      'player',
      body?.body?.playerID ?? '(unknown)',
    );
  }
});

server.run(8000, () => {
  console.log('🌟 Sevens server running on http://localhost:8000');

  // Log websocket clients when they sync (connect) with matchID & playerID
  const appAny = server.app as any;
  const io = appAny._io;

  if (io) {
    const nsp = io.of('sevens');
    nsp.on('connection', (socket: any) => {
      socket.on('sync', (matchID: string, playerID: string, credentials: string) => {
        console.log('🔌 WS client synced:', { matchID, playerID });
      });
    });
  }
});
