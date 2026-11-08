import process from 'node:process'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const updateTestVersion = process.env.VITE_UPDATE_TEST_VERSION

export default defineConfig({
  base: '/tools/',
  plugins: [
    updateTestVersion && {
      name: 'update-test-version',
      apply: 'build',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: { name: 'build-version', content: updateTestVersion },
            injectTo: 'head',
          },
        ]
      },
    },
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Local Tools',
        short_name: 'Local Tools',
        description: 'On-device utility tools',
        start_url: '/tools/',
        scope: '/tools/',
        display: 'standalone',
        theme_color: '#5b3cc4',
        background_color: '#faf9fc',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
