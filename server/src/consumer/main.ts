import 'dotenv/config';

import { closeDatabaseConnection, connectToDatabase } from '../database/mongoose';
import { startGameEndConsumer } from './consumers';
import { connectRedisClient, closeRedisClient } from './utils/redis';

async function main() {
  await connectToDatabase();
  const redis = await connectRedisClient();
  const consumer = await startGameEndConsumer(redis);

  const shutdown = async (signal: string) => {
    console.info('[consumer:main] shutdown requested', { signal });
    await consumer.stop();
    await closeRedisClient(redis);
    await closeDatabaseConnection();
  };

  const handleSignal = (signal: string) => {
    void shutdown(signal).catch((error) => {
      console.error('[consumer:main] shutdown failed', error);
      process.exitCode = 1;
    });
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));

  process.on('uncaughtException', (error) => {
    console.error('[consumer:main] uncaught exception', error);
    process.exitCode = 1;
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[consumer:main] unhandled rejection', reason);
    process.exitCode = 1;
  });
}

void main().catch((error) => {
  console.error('[consumer:main] failed to start', error);
  process.exit(1);
});
