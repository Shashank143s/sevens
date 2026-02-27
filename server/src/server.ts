import { Server, Origins } from 'boardgame.io/server';
import { Sevens } from './game';

const server = Server({
  games: [Sevens],
  origins: [Origins.LOCALHOST],
});

server.run(8000, () =>
  console.log('🌟 Sevens server running on http://localhost:8000'),
);
