import { createClient } from 'redis';
import {
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_TLS,
  REDIS_URL,
  REDIS_USERNAME,
} from '../../config';

export type RedisClient = ReturnType<typeof createClient>;

function buildRedisUrl() {
  if (REDIS_URL) return REDIS_URL;
  if (!REDIS_HOST) {
    throw new Error('REDIS_URL or REDIS_HOST is required for the consumer worker');
  }

  const protocol = REDIS_TLS ? 'rediss' : 'redis';
  const username = encodeURIComponent(REDIS_USERNAME || 'default');
  const password = REDIS_PASSWORD ? `:${encodeURIComponent(REDIS_PASSWORD)}` : '';
  return `${protocol}://${username}${password}@${REDIS_HOST}:${REDIS_PORT}`;
}

export async function connectRedisClient(): Promise<RedisClient> {
  const client = createClient({ url: buildRedisUrl() });
  client.on('error', (error) => {
    console.error('[consumer:redis] redis client error', error);
  });
  await client.connect();
  return client;
}

export async function closeRedisClient(client?: RedisClient | null) {
  if (!client) return;
  try {
    await client.quit();
  } catch (error) {
    console.error('[consumer:redis] failed to close client', error);
  }
}

export async function claimProcessingLock(
  client: RedisClient,
  key: string,
  ttlSeconds: number,
  value: string,
) {
  const result = await client.set(key, value, {
    EX: ttlSeconds,
    NX: true,
  });
  return result === 'OK';
}

export async function setCompletionMarker(
  client: RedisClient,
  key: string,
  ttlSeconds: number,
  value: string,
) {
  await client.set(key, value, {
    EX: ttlSeconds,
  });
}

export async function deleteKey(client: RedisClient, key: string) {
  await client.del(key);
}

export async function hasKey(client: RedisClient, key: string) {
  return (await client.exists(key)) > 0;
}
