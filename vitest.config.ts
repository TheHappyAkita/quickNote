import { defineConfig } from 'vitest/config'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
      ],
      dts: true,
    }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    server: {
      deps: {
        inline: ['vuetify']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '~': path.resolve(__dirname, './app'),
      '#shared': path.resolve(__dirname, './shared'),
    },
  },
})
