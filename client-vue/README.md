# Sevens Client (Vue 3 / Nuxt)

Vue 3 replica of the Sevens client, built with Nuxt 3 and Composition API.

## Stack

- **Nuxt 3** – Vue framework with file-based routing
- **Vue 3** – Composition API style
- **TypeScript**
- **Tailwind CSS**
- **boardgame.io** – Game state and multiplayer
- **@vueuse/motion** – Animations

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs at `http://localhost:3000` (Nuxt default). Ensure the game server is running at `http://localhost:8000`.

## Build

```bash
npm run build
```

## Project Structure

```
client-vue/
├── app.vue              # Root layout
├── assets/css/          # Global styles
├── components/          # Vue components
│   ├── AvatarPicker.vue
│   ├── GameBoard.vue
│   └── SevensGameBoard.vue
├── composables/         # Composition API composables
│   └── useSevensClient.ts
├── pages/               # File-based routes
│   ├── index.vue        # Home (create/join room)
│   └── room/[matchID].vue
├── plugins/
│   └── motion.client.ts # VueUse Motion plugin
└── nuxt.config.ts
```

## Shared Code

Uses shared types from `../shared/types.ts` and game logic from `../server/src/game.ts`.
