import { InferSchemaType, Model, Schema, Types, model, models } from 'mongoose';

const gamePlayerSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    player_id: {
      type: String,
      required: true,
      trim: true,
    },
    display_name: {
      type: String,
      required: true,
      trim: true,
    },
    is_bot: {
      type: Boolean,
      required: true,
      default: false,
    },
    joined_at: {
      type: Date,
    },
    left_at: {
      type: Date,
    },
    result: {
      type: String,
      enum: ['won', 'lost', 'unknown'],
      required: true,
      default: 'unknown',
    },
    finish_position: {
      type: Number,
      min: 1,
    },
    coins: {
      type: new Schema(
        {
          reserved: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
          },
          delta: {
            type: Number,
            required: true,
            default: 0,
          },
        },
        { _id: false },
      ),
      required: true,
      default: () => ({
        reserved: 0,
        delta: 0,
      }),
    },
    xp: {
      type: new Schema(
        {
          delta: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
          },
        },
        { _id: false },
      ),
      required: true,
      default: () => ({
        delta: 0,
      }),
    },
  },
  {
    _id: false,
  },
);

const gameMetadataSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['web', 'pwa', 'apk'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const gameAccessSchema = new Schema(
  {
    is_private: {
      type: Boolean,
      required: true,
      default: false,
    },
    password_hash: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const gameCoinRulesSchema = new Schema(
  {
    stake: {
      type: Number,
      required: true,
      default: 10,
      min: 10,
    },
    bot_reward: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const gameCoinSettlementSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'completed', 'void'],
      required: true,
      default: 'pending',
    },
    settled_at: {
      type: Date,
    },
    human_player_count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    bot_count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    human_pot: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    bot_bonus: {
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

const gameXpSettlementSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'completed', 'void'],
      required: true,
      default: 'pending',
    },
    settled_at: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const gameSchema = new Schema(
  {
    match_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    game_name: {
      type: String,
      required: true,
      default: 'sevens',
      trim: true,
    },
    room_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    room_size: {
      type: Number,
      required: true,
      min: 2,
    },
    player_count: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    bot_count: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['created', 'in_progress', 'completed', 'abandoned'],
      required: true,
      default: 'created',
      index: true,
    },
    creator_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    players: {
      type: [gamePlayerSchema],
      required: true,
      default: [],
    },
    winner_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    started_at: {
      type: Date,
    },
    ended_at: {
      type: Date,
      index: true,
    },
    metadata: {
      type: gameMetadataSchema,
    },
    coin_rules: {
      type: gameCoinRulesSchema,
      required: true,
      default: () => ({
        stake: 10,
        bot_reward: 10,
      }),
    },
    coin_settlement: {
      type: gameCoinSettlementSchema,
      required: true,
      default: () => ({
        status: 'pending',
        human_player_count: 0,
        bot_count: 0,
        human_pot: 0,
        bot_bonus: 0,
      }),
    },
    xp_settlement: {
      type: gameXpSettlementSchema,
      required: true,
      default: () => ({
        status: 'pending',
      }),
    },
    access: {
      type: gameAccessSchema,
      default: () => ({ is_private: false }),
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

gameSchema.index({ 'players.user_id': 1, ended_at: -1 });
gameSchema.index({ creator_user_id: 1, created_at: -1 });

export type GamePlayerDocument = InferSchemaType<typeof gamePlayerSchema>;
export type GameDocument = InferSchemaType<typeof gameSchema> & {
  winner_user_id?: Types.ObjectId;
};
export type GameModelType = Model<GameDocument>;

export const GameModel =
  (models.Game as GameModelType | undefined) ?? model<GameDocument>('Game', gameSchema);
