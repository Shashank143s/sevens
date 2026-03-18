import type { JsonBodyContext, Next } from './common.types';

export type JoinRouteContext = JsonBodyContext & {
  method: string;
  path: string;
  status: number;
  body?: unknown;
};

export type DeleteRouteContext = {
  method: string;
  path: string;
  status: number;
  body?: unknown;
};

export type DeleteRouteServer = {
  db: {
    wipe: (matchID: string) => void | Promise<void>;
  };
  transport?: {
    deleteMatchQueue?: (matchID: string) => void;
  };
};

export type RouteNext = Next;
