import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/PowerEng-Study/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Power Engineering Study',
        short_name: 'Power Study',
        description: 'Offline first Fourth Class Power Engineering study platform',
        theme_color: '#0b5d75',
        background_color: '#07141b',
        display: 'standalone',
        start_url: '/PowerEng-Study/',
        icons: [
          { src: '/PowerEng-Study/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/PowerEng-Study/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
        navigateFallback: '/PowerEng-Study/index.html'
      }
    })
  ]
});
