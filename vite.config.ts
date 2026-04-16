import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
      interval: 400,
    },
    proxy: {
      '/tiles': {
        target: 'https://nwk-app-ba6f8.web.app',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://nwk-app-ba6f8.web.app',
        changeOrigin: true,
      },
    },
  },
})
