import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The browser app runs on port 5173 (Vite). The Node/Express backend runs on
// port 5174. Any request the frontend makes to "/api/..." is transparently
// forwarded to the backend. This is why the browser NEVER needs an API key:
// it only ever talks to our own backend, which holds the keys server-side.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
    },
  },
})
