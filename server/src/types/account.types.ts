export type AccountPayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  profile_image_url?: string;
  avatar_emoji?: string;
  last_login_at?: string | number | Date;
};

export type RecentGameResult = {
  match_id: string;
  room_name?: string;
  status: string;
  room_size: number;
  result: string;
  coins_delta?: number;
  xp_delta?: number;
  winner_user_id?: string;
  winner_name?: string;
  winner_is_bot?: boolean;
  ended_at?: Date;
};

export type AccountApiUserPayload = {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_image_url?: string;
  avatar_emoji?: string;
  last_login_at: Date;
  is_active: boolean;
  deleted_at?: Date | null;
  stats?: {
    games_played: number;
    wins: number;
    losses: number;
  };
  wallet?: {
    coins_balance: number;
    coins_reserved: number;
  };
  progression?: {
    xp_total: number;
    level: number;
  };
  daily_room_limit: number;
  remaining_rooms: number;
  created_at?: Date;
  updated_at?: Date;
};
