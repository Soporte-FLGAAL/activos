import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        // El backend Express corre por defecto en el puerto 3000 y monta /api.
        '/api': {
          target: env.VITE_BACKEND_PROXY || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});