import { Server, Origins } from 'boardgame.io/server';
import { Sevens } from './game';
import { PORT } from './config';
import { corsMiddleware } from './middleware/cors.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { joinRoute } from './routes/join.router';
import { createDeleteRoute } from './routes/delete.router';

const server = Server({
  games: [Sevens],
  origins: [Origins.LOCALHOST],
});

server.app.use(corsMiddleware);

server.app.use(joinRoute);
server.app.use(createDeleteRoute(server as any));

server.app.use(loggerMiddleware);

server.run(PORT, () => {
  console.log(`🌟 Sevens server running on http://localhost:${PORT}`);

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
