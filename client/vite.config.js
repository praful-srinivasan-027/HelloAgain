import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the parent directory (global .env)
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const envDir = '../';
  const env = loadEnv(mode, envDir, '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000';
  const backendWsUrl = backendUrl.replace(/^http/, 'ws');

  return {
    envDir,
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/login': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/register': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/me': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/email': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/username': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/userinfo': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/messageHistory': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: backendWsUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
