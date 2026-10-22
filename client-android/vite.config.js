import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Listen on all local IPs so Android phone can connect over Wi-Fi
    port: 5174,
    proxy: {
      '/login': {
        target: 'https://helloagain-reverse-proxy.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/register': {
        target: 'https://helloagain-reverse-proxy.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/me': {
        target: 'https://helloagain-reverse-proxy.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/email': {
        target: 'https://helloagain-reverse-proxy.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/userinfo': {
        target: 'https://helloagain-reverse-proxy.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/messageHistory': {
        target: 'https://helloagain-reverse-proxy.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/ws': {
        target: 'wss://helloagain-reverse-proxy.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
