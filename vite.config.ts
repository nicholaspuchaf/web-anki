import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.endsWith('/src/content/aws-services.json'))
            return 'aws-catalog';
          if (
            id.endsWith('/src/content/design-patterns.json') ||
            id.endsWith('/src/content/design-pattern-assets.json')
          )
            return 'patterns-catalog';
          if (id.endsWith('/src/content/feed-design-patterns.json'))
            return 'feed-patterns-catalog';
        },
      },
    },
  },
  plugins: [
    react({ babel: { plugins: ['babel-plugin-react-compiler'] } }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Folha · Cartões de estudo',
        short_name: 'Folha',
        lang: 'pt-BR',
        description: 'Cartões e revisões no seu ritmo.',
        theme_color: '#264e42',
        background_color: '#f5f3ec',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,jpg,jpeg,ico,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});
