export type GamePlayerPayload = {
  user_id?: string;
  player_id: string;
  display_name: string;
  is_bot?: boolean;
  joined_at?: string | number | Date;
  left_at?: string | number | Date;
  result?: 'won' | 'lost' | 'unknown';
  finish_position?: number;
  coins?: {
    reserved?: number;
    delta?: number;
  };
  xp?: {
    delta?: number;
  };
};

export type CreateGamePayload = {
  room_name: string;
  room_size: number;
  creator_user_id?: string;
  card_theme?: 'normal' | 'wwe-legends' | 'wwe-womans';
  coin_rules?: {
    stake?: number;
  };
  access?: {
    is_private?: boolean;
    password?: string;
  };
  players?: GamePlayerPayload[];
  metadata?: {
    source?: 'web' | 'pwa' | 'apk';
    notes?: string;
  };
};

export type UpdateGamePayload = {
  status?: 'created' | 'in_progress' | 'completed' | 'abandoned';
  players?: GamePlayerPayload[];
  joined_player?: GamePlayerPayload;
  room_size?: number;
  winner_user_id?: string;
  winner_seat_id?: string;
  winner_player_id?: string;
  started_at?: string | number | Date;
  ended_at?: string | number | Date;
  metadata?: {
    source?: 'web' | 'pwa' | 'apk';
    notes?: string;
  };
  coin_settlement?: {
    status: 'pending' | 'completed' | 'void';
    settled_at?: string | number | Date;
    human_player_count?: number;
    bot_count?: number;
    human_pot?: number;
    bot_bonus?: number;
  };
  xp_settlement?: {
    status: 'pending' | 'completed' | 'void';
    settled_at?: string | number | Date;
  };
};

export type JoinAuthorizationPayload = {
  password?: string;
  user_id?: string;
};
