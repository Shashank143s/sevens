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
};
