import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      __BOOKS_API_URL__: JSON.stringify(
        env.VITE_BOOKS_API_URL || 'http://localhost:3000'
      ),
    },
  };
});
