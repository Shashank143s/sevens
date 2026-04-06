import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const userStatsSchema = new Schema(
  {
    games_played: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    wins: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    losses: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const userWalletSchema = new Schema(
  {
    coins_balance: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
    },
    coins_reserved: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const userProgressionSchema = new Schema(
  {
    xp_total: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  {
    _id: false,
  },
);

const userLocationSchema = new Schema(
  {
    ip_address: {
      type: String,
      trim: true,
    },
    country_code: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
    },
    country_name: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'ip',
    },
    captured_at: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const userLegalConsentSchema = new Schema(
  {
    privacy_policy_accepted_at: {
      type: Date,
    },
    terms_accepted_at: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    profile_image_url: {
      type: String,
      trim: true,
    },
    avatar_emoji: {
      type: String,
      trim: true,
      default: '🐶',
    },
    last_login_at: {
      type: Date,
      required: true,
      index: true,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    stats: {
      type: userStatsSchema,
      required: true,
      default: () => ({
        games_played: 0,
        wins: 0,
        losses: 0,
      }),
    },
    wallet: {
      type: userWalletSchema,
      required: true,
      default: () => ({
        coins_balance: 100,
        coins_reserved: 0,
      }),
    },
    progression: {
      type: userProgressionSchema,
      required: true,
      default: () => ({
        xp_total: 0,
        level: 1,
      }),
    },
    location: {
      type: userLocationSchema,
      required: false,
    },
    legal_consent: {
      type: userLegalConsentSchema,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    versionKey: false,
  },
);

userSchema.index({
  is_active: 1,
  'wallet.coins_balance': -1,
  'progression.level': -1,
  'progression.xp_total': -1,
  'stats.wins': -1,
  created_at: 1,
});

export type UserDocument = InferSchemaType<typeof userSchema>;
export type UserModelType = Model<UserDocument>;

export const UserModel =
  (models.User as UserModelType | undefined) ?? model<UserDocument>('User', userSchema);
