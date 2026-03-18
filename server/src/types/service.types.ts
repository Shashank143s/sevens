export type GameDetails = {
  players?: { id: number; name?: string | null }[];
};

export type JoinGamePayload = {
  playerID: string;
  playerName: string;
  data: Record<string, unknown>;
};

export type JoinGameResponse = {
  playerID: string;
  playerCredentials: string;
};
