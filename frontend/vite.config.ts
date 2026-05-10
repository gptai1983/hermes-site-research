import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/trpc': {
        target: 'http://172.21.47.227:3000',
        changeOrigin: true,
      },
    },
  },
});
