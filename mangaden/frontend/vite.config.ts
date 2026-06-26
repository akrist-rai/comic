import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /api requests to the Koa backend during development.
    // This means fetch('/api/manga') in React hits localhost:3001/api/manga —
    // no CORS headers needed in production builds.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
