import { Server, Origins } from 'boardgame.io/server';
import { Sevens } from './game';
import { HOST, PORT } from './config';
import { closeDatabaseConnection, connectToDatabase } from './database/mongoose';
import { corsMiddleware } from './middleware/cors.middleware';
import { geoMiddleware } from './middleware/geo.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { accountRoute } from './routes/account.router';
import { authRoute } from './routes/auth.router';
import { joinRoute } from './routes/join.router';
import { createDeleteRoute } from './routes/delete.router';
import { createCleanupRoute } from './routes/cleanup.router';
import { createGameRoute } from './routes/game.router';
import { leaderboardRoute } from './routes/leaderboard.router';
import { roomsRoute } from './routes/rooms.router';
import { appRoute } from './routes/app.router';
import { listLobbyPresence, removeLobbyPresence, upsertLobbyPresence } from './services/lobby-presence.service';
import { closeGameEndPublisher } from './services/game-end-publisher.service';

const server = Server({
  games: [Sevens],
  origins: [Origins.LOCALHOST],
});

let runningServers: Awaited<ReturnType<typeof server.run>> | null = null;
let shuttingDown = false;

async function closeServerHandle(
  label: 'appServer' | 'apiServer',
  handle?: { close: (callback: () => void) => void } | null,
) {
  if (!handle) return;
  console.info(`[server] closing ${label}`);
  await new Promise<void>((resolve) => handle.close(() => resolve()));
  console.info(`[server] closed ${label}`);
}

async function withTimeout<T>(label: string, promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function registerRoutes() {
  server.app.use(corsMiddleware);
  server.app.use(geoMiddleware);
  server.app.use(authRoute);
  server.app.use(accountRoute);
  server.app.use(leaderboardRoute);
  server.app.use(roomsRoute);
  server.app.use(appRoute);
  server.app.use(createGameRoute(server as any));
  server.app.use(joinRoute);
  server.app.use(createDeleteRoute(server as any));
  server.app.use(createCleanupRoute(server as any));
  server.app.use(loggerMiddleware);
}

function attachSocketLogging() {
  const io = (server.app as any)._io;
  if (!io) return;

  const lobbyNamespace = io.of('/lobby');

  lobbyNamespace.on('connection', (socket: any) => {
    socket.on('presence:join', (payload: { userId?: string; name?: string }) => {
      const presence = upsertLobbyPresence(socket.id, {
        userId: payload.userId ?? '',
        name: payload.name ?? '',
      });

      socket.data = socket.data ?? {};
      socket.data.userId = presence?.userId ?? '';
      socket.data.name = presence?.name ?? '';

      lobbyNamespace.emit('presence:snapshot', { users: listLobbyPresence() });
    });

    socket.on('presence:leave', () => {
      removeLobbyPresence(socket.id);
      lobbyNamespace.emit('presence:snapshot', { users: listLobbyPresence() });
    });

    socket.on('disconnect', () => {
      removeLobbyPresence(socket.id);
      lobbyNamespace.emit('presence:snapshot', { users: listLobbyPresence() });
    });
  });

  io.of('sevens').on('connection', (socket: any) => {
    socket.on('sync', (matchID: string, playerID: string) => {
      console.log('🔌 WS client synced:', { matchID, playerID });
    });
  });
}

async function startServer() {
  await connectToDatabase();
  registerRoutes();
  runningServers = await server.run(PORT, onServerStarted);
}

function onServerStarted() {
  console.log(`🌟 Sevens server running on http://${HOST}:${PORT}`);
  attachSocketLogging();
}

async function closePublisherOnSignal(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info('[server] shutdown requested', { signal });
  console.info('[server] closing rabbitmq publisher');
  await closeGameEndPublisher();
  console.info('[server] closed rabbitmq publisher');
  try {
    console.info('[server] closing database connection');
    await closeDatabaseConnection();
    console.info('[server] closed database connection');
  } catch (error) {
    console.error('[server] failed to close database connection', error);
  }
  try {
    await withTimeout('app server close', closeServerHandle('appServer', runningServers?.appServer), 5000);
  } catch (error) {
    console.error('[server] failed to close app server', error);
  }
  try {
    await withTimeout('api server close', closeServerHandle('apiServer', runningServers?.apiServer), 5000);
  } catch (error) {
    console.error('[server] failed to close api server', error);
  }
  console.info('[server] shutdown complete');
  process.exit(0);
}

process.on('SIGINT', () => {
  void closePublisherOnSignal('SIGINT').catch((error) => {
    console.error('[server] shutdown failed', error);
    process.exitCode = 1;
  });
});

process.on('SIGTERM', () => {
  void closePublisherOnSignal('SIGTERM').catch((error) => {
    console.error('[server] shutdown failed', error);
    process.exitCode = 1;
  });
});

void startServer();
