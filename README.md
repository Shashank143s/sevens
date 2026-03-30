# Sevens Royale

Sevens Royale is a multiplayer card game platform built around the classic **Sevens / Seven Up / Seven Down** ruleset. It includes a Nuxt PWA frontend, a TypeScript backend powered by `boardgame.io`, room-based multiplayer, coins and XP progression, leaderboards, match history, and Android APK distribution.

## Project Structure

```text
sevens/
├── client-vue/   # Nuxt 3 PWA frontend
├── server/       # TypeScript backend + boardgame.io server
├── shared/       # Shared types
└── client/       # Older client implementation
```

## Tech Stack

- Frontend: `Nuxt 3`, `Vue 3`, `TypeScript`, `Tailwind CSS`, `@vite-pwa/nuxt`
- Backend: `Node.js`, `TypeScript`, `boardgame.io`, `Express`, `Mongoose`
- Database: `MongoDB`
- Auth: `Google Sign-In`
- Deployment: `Render`
- DNS/CDN: `Cloudflare`

## Local Development

You will usually run the frontend and backend in separate terminals.

### 1. Start the backend

```bash
cd server
npm install
npm run dev
```

Backend default:

- `http://localhost:8000`

### 2. Start the frontend

```bash
cd client-vue
npm install
npm run dev
```

Frontend default:

- `http://localhost:3000`

## Environment Variables

Create local `.env` files in both apps.

### Frontend

Required in `client-vue/.env`:

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
NUXT_PUBLIC_SOCKET_SERVER=http://localhost:8000
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Backend

Required in `server/.env`:

```env
PORT=8000
API_BASE=http://localhost:8000
SERVER_URL=http://localhost:8000
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_ORIGIN_REGEX=^https?:\/\/(localhost(:\d+)?)$
MONGODB_URI=your_mongodb_connection_string
MAX_DAILY_GAMES_PER_USER=10
```

## Where To Look Next

- Frontend guide: [client-vue/README.md](/Users/shashanksk/Desktop/sevens/sevens/client-vue/README.md)
- Backend guide: [server/README.md](/Users/shashanksk/Desktop/sevens/sevens/server/README.md)

## Production Notes

- Public SEO assets:
  - `/robots.txt`
  - `/sitemap.xml`
