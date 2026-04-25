import 'dotenv/config';

// Defaults are localhost-only for dev. Set env vars in production (no secrets in code).
const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8000);
const API_BASE = process.env.API_BASE ?? `http://localhost:${PORT}`;
const SERVER_URL = process.env.SERVER_URL ?? API_BASE;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/sevens';
const MAX_DAILY_GAMES_PER_USER = Number(process.env.MAX_DAILY_GAMES_PER_USER ?? 10);
const GEOLOOKUP_BASE_URL = process.env.GEOLOOKUP_BASE_URL ?? 'https://ipwho.is';
const FRONTEND_ORIGIN_REGEX =
  process.env.FRONTEND_ORIGIN_REGEX ?? '^https?:\\/\\/(localhost(:\\d+)?)$';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const CLEANUP_CRON_SECRET = process.env.CLEANUP_CRON_SECRET ?? '';
const STALE_ROOM_CUTOFF_MINUTES = Number(process.env.STALE_ROOM_CUTOFF_MINUTES ?? 30);
const GOOGLE_AUTH_CLIENT_IDS = (process.env.GOOGLE_AUTH_CLIENT_IDS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const ANDROID_LATEST_VERSION_CODE = Number(process.env.ANDROID_LATEST_VERSION_CODE ?? 7);
const ANDROID_MIN_SUPPORTED_VERSION_CODE = Number(process.env.ANDROID_MIN_SUPPORTED_VERSION_CODE ?? 7);
const ANDROID_UPDATE_MODE_RAW = (process.env.ANDROID_UPDATE_MODE ?? 'flexible').trim().toLowerCase();
const ANDROID_UPDATE_MODE = ANDROID_UPDATE_MODE_RAW === 'immediate' ? 'immediate' : 'flexible';
const ANDROID_UPDATE_MESSAGE = (process.env.ANDROID_UPDATE_MESSAGE ?? '').trim();
const RABBITMQ_URL = (process.env.RABBITMQ_URL ?? '').trim();
const RABBITMQ_EXCHANGE = (process.env.RABBITMQ_EXCHANGE ?? 'sevens.game').trim();
const RABBITMQ_EXCHANGE_TYPE = (process.env.RABBITMQ_EXCHANGE_TYPE ?? 'topic').trim();
const RABBITMQ_ROUTING_KEY = (process.env.RABBITMQ_ROUTING_KEY ?? 'sevens.game.end').trim();
const RABBITMQ_QUEUE = (process.env.RABBITMQ_QUEUE ?? 'sevens.game.end').trim();
const RABBITMQ_MAIN_QUEUE_TTL_MS = Number(process.env.RABBITMQ_MAIN_QUEUE_TTL_MS ?? 60000);
const RABBITMQ_RETRY_EXCHANGE = (process.env.RABBITMQ_RETRY_EXCHANGE ?? 'sevens.game.retry.v2').trim();
const RABBITMQ_RETRY_QUEUE = (process.env.RABBITMQ_RETRY_QUEUE ?? 'sevens.game.end.retry.v2').trim();
const RABBITMQ_RETRY_ROUTING_KEY = (process.env.RABBITMQ_RETRY_ROUTING_KEY ?? 'sevens.game.end.retry.v2').trim();
const RABBITMQ_RETRY_DELAY_MS = Number(process.env.RABBITMQ_RETRY_DELAY_MS ?? 5000);
const RABBITMQ_DLX_EXCHANGE = (process.env.RABBITMQ_DLX_EXCHANGE ?? 'dlx.sevens.game').trim();
const RABBITMQ_DLX_QUEUE = (process.env.RABBITMQ_DLX_QUEUE ?? 'dlx.sevens.game.end').trim();
const RABBITMQ_DLX_ROUTING_KEY = (process.env.RABBITMQ_DLX_ROUTING_KEY ?? 'dlx.sevens.game.end').trim();
const RABBITMQ_MAX_RETRIES = Number(process.env.RABBITMQ_MAX_RETRIES ?? 3);
const REDIS_URL = (process.env.REDIS_URL ?? '').trim();
const REDIS_HOST = (process.env.REDIS_HOST ?? '').trim();
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const REDIS_USERNAME = (process.env.REDIS_USERNAME ?? 'default').trim();
const REDIS_PASSWORD = (process.env.REDIS_PASSWORD ?? '').trim();
const REDIS_TLS = (process.env.REDIS_TLS ?? 'false').trim().toLowerCase() !== 'false';

export {
  HOST,
  PORT,
  API_BASE,
  SERVER_URL,
  MONGODB_URI,
  MAX_DAILY_GAMES_PER_USER,
  GEOLOOKUP_BASE_URL,
  FRONTEND_ORIGIN_REGEX,
  FRONTEND_ORIGIN,
  CLEANUP_CRON_SECRET,
  STALE_ROOM_CUTOFF_MINUTES,
  GOOGLE_AUTH_CLIENT_IDS,
  ANDROID_LATEST_VERSION_CODE,
  ANDROID_MIN_SUPPORTED_VERSION_CODE,
  ANDROID_UPDATE_MODE,
  ANDROID_UPDATE_MESSAGE,
  RABBITMQ_URL,
  RABBITMQ_EXCHANGE,
  RABBITMQ_EXCHANGE_TYPE,
  RABBITMQ_ROUTING_KEY,
  RABBITMQ_QUEUE,
  RABBITMQ_MAIN_QUEUE_TTL_MS,
  RABBITMQ_RETRY_EXCHANGE,
  RABBITMQ_RETRY_QUEUE,
  RABBITMQ_RETRY_ROUTING_KEY,
  RABBITMQ_RETRY_DELAY_MS,
  RABBITMQ_DLX_EXCHANGE,
  RABBITMQ_DLX_QUEUE,
  RABBITMQ_DLX_ROUTING_KEY,
  RABBITMQ_MAX_RETRIES,
  REDIS_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD,
  REDIS_TLS,
};
