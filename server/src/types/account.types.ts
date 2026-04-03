export type AccountPayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  profile_image_url?: string;
  avatar_emoji?: string;
  last_login_at?: string | number | Date;
  legal_consent?: {
    privacy_policy_accepted_at?: string | number | Date;
    terms_accepted_at?: string | number | Date;
  };
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
  location?: {
    country_code?: string;
    country_name?: string;
    region?: string;
  };
  legal_consent?: {
    privacy_policy_accepted_at?: Date;
    terms_accepted_at?: Date;
  };
  daily_room_limit?: number;
  remaining_rooms?: number;
  created_at?: Date;
  updated_at?: Date;
};

export type AccountGeoPayload = {
  ipAddress?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
  source: 'header' | 'ip';
  capturedAt: Date;
};

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  full_name: string;
  profile_image_url?: string;
  avatar_emoji?: string;
  country_code?: string;
  country_name?: string;
  wins: number;
  games_played: number;
  win_percentage: number;
  coins_balance: number;
  level: number;
  xp_total: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  current_user?: LeaderboardEntry;
};

export type AccountGamesResponse = {
  user: {
    _id: string;
    stats?: {
      games_played: number;
      wins: number;
      losses: number;
    };
  };
  recent_games_page: {
    games: RecentGameResult[];
    has_more: boolean;
    offset: number;
    limit: number;
  };
};

export type GoogleSignInPayload = {
  credential?: string;
  legal_accepted_at?: string | number | Date;
};
