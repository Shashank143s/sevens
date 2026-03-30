# Sevens Royale Frontend

This is the Nuxt 3 PWA frontend for Sevens Royale. It handles onboarding, lobby flows, room join/create UX, the live game experience, match history, leaderboard, downloads, legal pages, and mobile-friendly polish.

## Stack

- `Nuxt 3`
- `Vue 3`
- `TypeScript`
- `Tailwind CSS`
- `@vite-pwa/nuxt`
- `boardgame.io` client integration
- `@vueuse/motion`

## Features

- Google Sign-In onboarding
- Responsive lobby and room flows
- Private rooms and stake-based matches
- Wallet, XP, and level progression
- Match history and leaderboard
- Winner overlays, loading skeletons, and polished mobile UI
- Android APK download page
- SEO assets: `robots.txt` and `sitemap.xml`

## Scripts

```bash
npm run dev
npm run build
npm run generate
npm run preview
```

## Local Setup

### 1. Install dependencies

```bash
cd client-vue
npm install
```

### 2. Create `.env`

Example:

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
NUXT_PUBLIC_SOCKET_SERVER=http://localhost:8000
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Start the app

```bash
npm run dev
```

Frontend runs on:

- `http://localhost:3000`

The backend should also be running locally on:

- `http://localhost:8000`

## Project Structure

```text
client-vue/
├── app.vue                  # App shell, splash, banners
├── assets/                  # CSS, images, audio, downloads
├── components/              # UI components and modals
├── composables/             # API, auth, session, gameplay helpers
├── middleware/              # Auth/global route handling
├── pages/                   # Public and protected routes
├── public/                  # Static assets, robots.txt, sitemap.xml
└── nuxt.config.ts           # Nuxt, PWA, runtime config
```

## Key Pages

- `/` home page
- `/instructions`
- `/downloads`
- `/privacy-policy`
- `/terms-and-conditions`
- `/lobby`
- `/room/[matchID]`
- `/account`
- `/account/games`
- `/account/leaderboard`

## Shared Dependencies

This frontend also uses shared code from:

- `../shared/types.ts`
- `../server/src/game.ts`

## Production Notes

- Set `NUXT_PUBLIC_SITE_URL` to your production frontend URL for correct canonical and Open Graph metadata.
