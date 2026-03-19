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
  status: string;
  room_size: number;
  result: string;
  winner_user_id?: string;
  winner_name?: string;
  winner_is_bot?: boolean;
  ended_at?: Date;
};
