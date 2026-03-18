import type { Next } from './common.types';

export type CorsContext = {
  method: string;
  get: (header: string) => string;
  set: (header: string, value: string) => void;
  status: number;
};

export type LoggerContext = {
  method: string;
  path: string;
  status: number;
  body?: { matchID?: string; playerID?: string };
  request?: { body?: { playerID?: string } };
};

export type MiddlewareNext = Next;
