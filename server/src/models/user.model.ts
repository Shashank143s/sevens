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
    stats: {
      type: userStatsSchema,
      required: true,
      default: () => ({
        games_played: 0,
        wins: 0,
        losses: 0,
      }),
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

export type UserDocument = InferSchemaType<typeof userSchema>;
export type UserModelType = Model<UserDocument>;

export const UserModel =
  (models.User as UserModelType | undefined) ?? model<UserDocument>('User', userSchema);
