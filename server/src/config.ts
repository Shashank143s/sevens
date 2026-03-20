import 'dotenv/config';

// Defaults are localhost-only for dev. Set env vars in production (no secrets in code).
const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8000);
const API_BASE = process.env.API_BASE ?? `http://localhost:${PORT}`;
const SERVER_URL = process.env.SERVER_URL ?? API_BASE;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/sevens';
const MAX_DAILY_GAMES_PER_USER = Number(process.env.MAX_DAILY_GAMES_PER_USER ?? 10);
const FRONTEND_ORIGIN_REGEX =
  process.env.FRONTEND_ORIGIN_REGEX ?? '^https?:\\/\\/(localhost(:\\d+)?)$';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

export {
  HOST,
  PORT,
  API_BASE,
  SERVER_URL,
  MONGODB_URI,
  MAX_DAILY_GAMES_PER_USER,
  FRONTEND_ORIGIN_REGEX,
  FRONTEND_ORIGIN,
};
