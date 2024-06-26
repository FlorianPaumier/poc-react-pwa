import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    eslint({
      failOnWarning: false,
      failOnError: false
    }),
    VitePWA({
      registerType: 'autoUpdate', // default is 'prompt'
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,pdf}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'React OpenLayers',
        short_name: 'React OpenLayers',
        description: 'OpenLayers PWA made with React & Vite',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'https://risknat.org/wp-content/uploads/2024/02/Logo-REGALT-1.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://risknat.org/wp-content/uploads/2024/02/Logo-REGALT-1.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
})
