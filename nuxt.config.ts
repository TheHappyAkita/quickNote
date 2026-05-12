export default defineNuxtConfig({
  compatibilityDate: '2026-05-05',
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    '@vite-pwa/nuxt',
  ],

  vuetify: {
    moduleOptions: {
      importComposables: true,
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              primary: '#6C63FF',
              secondary: '#9C8FFF',
              background: '#0F0F17',
              surface: '#1A1A2E',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FB8C00',
            },
          },
          hackerGreen: {
            dark: true,
            colors: {
              primary: '#00FF41',
              secondary: '#00CC33',
              background: '#000000',
              surface: '#0a0a0a',
              error: '#FF3131',
              info: '#00FF41',
              success: '#00FF41',
              warning: '#FFFF00',
            },
          },
        },
      },
    },
  },

  pwa: {
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    manifest: {
      name: 'quickNote',
      short_name: 'qNote',
      description: 'Personal knowledge base and daily note-taking',
      theme_color: '#6C63FF',
      background_color: '#0F0F17',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
    },
    workbox: {
      navigateFallback: null,
      skipWaiting: true,
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/notes/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'notes-api-cache',
            expiration: {
              maxEntries: 1000,
              maxAgeSeconds: 60 * 60 * 24 * 7,
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
  },

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || '',
    notesDir: process.env.NOTES_DIR || '~/.quickNote',
    authUsers: process.env.AUTH_USERS || '[]',
  },
})
