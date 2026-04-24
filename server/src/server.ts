import { Server, Origins } from 'boardgame.io/server';
import { Sevens } from './game';
import { HOST, PORT } from './config';
import { connectToDatabase } from './database/mongoose';
import { corsMiddleware } from './middleware/cors.middleware';
import { geoMiddleware } from './middleware/geo.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { accountRoute } from './routes/account.router';
import { authRoute } from './routes/auth.router';
import { joinRoute } from './routes/join.router';
import { createDeleteRoute } from './routes/delete.router';
import { createCleanupRoute } from './routes/cleanup.router';
import { gameRoute } from './routes/game.router';
import { leaderboardRoute } from './routes/leaderboard.router';
import { roomsRoute } from './routes/rooms.router';
import { appRoute } from './routes/app.router';
import { listLobbyPresence, removeLobbyPresence, upsertLobbyPresence } from './services/lobby-presence.service';

const server = Server({
  games: [Sevens],
  origins: [Origins.LOCALHOST],
});

function registerRoutes() {
  server.app.use(corsMiddleware);
  server.app.use(geoMiddleware);
  server.app.use(authRoute);
  server.app.use(accountRoute);
  server.app.use(leaderboardRoute);
  server.app.use(roomsRoute);
  server.app.use(appRoute);
  server.app.use(gameRoute);
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
  server.run(PORT, onServerStarted);
}

function onServerStarted() {
  console.log(`🌟 Sevens server running on http://${HOST}:${PORT}`);
  attachSocketLogging();
}

void startServer();
