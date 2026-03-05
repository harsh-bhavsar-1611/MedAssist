import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://13.206.7.190',
        changeOrigin: true,
        secure: false, // For local dev
      },
    },
  },
})
