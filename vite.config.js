import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces (allows mobile access)
    port: 5189,      // Stable port
    allowedHosts: [
      'lawanda-pronaval-sterilely.ngrok-free.dev',
      '.ngrok-free.dev',
      'localhost'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
