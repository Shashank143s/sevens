import type { JsonBodyContext, Next } from './common.types';

export type ApiRouteContext = JsonBodyContext & {
  method: string;
  path: string;
  status: number;
  body?: unknown;
  state?: {
    geo?: {
      ipAddress?: string;
      countryCode?: string;
      countryName?: string;
      region?: string;
      source: 'header' | 'ip';
      capturedAt: Date;
    };
  };
};

export type JoinRouteContext = ApiRouteContext;
export type AccountRouteContext = ApiRouteContext;
export type GameRouteContext = ApiRouteContext;

export type GameRouteServer = DeleteRouteServer;
export type AuthRouteContext = ApiRouteContext;
export type CleanupRouteContext = ApiRouteContext & {
  headers?: Record<string, string | string[] | undefined>;
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

export type CleanupRouteServer = DeleteRouteServer;

export type RouteNext = Next;
