import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to Spring Boot so the browser sees a single origin.
// That keeps the SameSite=Strict auth cookie and the XSRF-TOKEN cookie first-party.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
});
