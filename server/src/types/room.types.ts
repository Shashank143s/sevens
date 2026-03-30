export type RoomPlayer = {
  id: number;
  name?: string | null;
  data?: {
    avatar?: string;
  };
};

export type RoomMatchPayload = {
  matchID: string;
  players: RoomPlayer[];
  setupData?: {
    numPlayers?: number;
    aiBots?: number;
  };
};

export type RoomListItem = RoomMatchPayload & {
  room_name: string;
  creator_name?: string;
  room_size: number;
  coin_stake: number;
  joined_count: number;
  game_status: 'created' | 'in_progress' | 'completed' | 'abandoned' | 'open' | 'full';
  is_private: boolean;
};
