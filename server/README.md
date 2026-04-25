# Sevens Royale Backend

The backend powers multiplayer game state, room lifecycle, joining, account sync, leaderboard data, recent games, coin settlement, and persistence for Sevens Royale.

## Stack

- `Node.js`
- `TypeScript`
- `boardgame.io`
- `Express`
- `Mongoose`
- `MongoDB`

## What It Handles

- Multiplayer game server for Sevens
- Room creation, join, and deletion flows
- Account onboarding and Google-profile sync
- Coins, stakes, XP, and settlement tracking
- Match history and leaderboard APIs
- Geo capture middleware for country-based display
- CORS and API route middleware

## Scripts

```bash
npm run dev
npm run dev:consumer
npm run build
npm run start
npm run start:consumer
```

## Local Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Create `.env`

Example:

```env
PORT=8000
API_BASE=http://localhost:8000
SERVER_URL=http://localhost:8000
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_ORIGIN_REGEX=^https?:\/\/(localhost(:\d+)?)$
MONGODB_URI=mongodb://127.0.0.1:27017/sevens
MAX_DAILY_GAMES_PER_USER=10
RABBITMQ_URL=amqps://user:pass@host/vhost
RABBITMQ_EXCHANGE=sevens.game
RABBITMQ_EXCHANGE_TYPE=topic
RABBITMQ_ROUTING_KEY=sevens.game.end
RABBITMQ_QUEUE=sevens.game.end
RABBITMQ_RETRY_EXCHANGE=sevens.game.retry
RABBITMQ_RETRY_QUEUE=sevens.game.end.retry
RABBITMQ_RETRY_ROUTING_KEY=sevens.game.end.retry
RABBITMQ_RETRY_DELAY_MS=5000
RABBITMQ_DLX_EXCHANGE=dlx.sevens.game
RABBITMQ_DLX_QUEUE=dlx.sevens.game.end
RABBITMQ_DLX_ROUTING_KEY=dlx.sevens.game.end
RABBITMQ_MAX_RETRIES=3
REDIS_HOST=redis-host.example.com
REDIS_PORT=19966
REDIS_USERNAME=default
REDIS_PASSWORD=secret
REDIS_TLS=true
```

Notes:

- `MONGODB_URI` should point to your local or hosted MongoDB instance
- `FRONTEND_ORIGIN_REGEX` controls which frontend origins are allowed by CORS

### 3. Start the server

```bash
npm run dev
```

Server runs on:

- `http://localhost:8000`

## Important Files

```text
server/
├── src/server.ts                 # Server bootstrap
├── src/game.ts                   # Sevens game definition
├── src/config.ts                 # Environment config
├── src/middleware/               # CORS, logging, geo, etc.
├── src/routes/                   # Account, game, join, leaderboard, rooms
├── src/services/                 # Economy, account, stats, game record logic
├── src/models/                   # Mongoose models
└── src/database/mongoose.ts      # Mongo connection
```

## API Responsibilities

- `/account` for user profile sync and account data
- `/leaderboard` for ranking data
- `/rooms` for lobby room listing
- `/game` for match/game record updates
- `/join` for room participation

## Production Notes

- Deployed on Render
- Update CORS env values when changing frontend domains
- Run the consumer as a separate process with `npm run start:consumer`
