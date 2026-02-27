import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sevens',
        short_name: 'Sevens',
        description: 'Classic Sevens card game',
        theme_color: '#1e2937',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    }),
  ],
  server: {
    fs: {
      // Allow importing shared code like the game definition from the sibling server folder
      allow: ['..'],
    },
  },
});
