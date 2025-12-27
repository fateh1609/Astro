
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the SDKs that expect it
      'process.env': {
        API_KEY: env.API_KEY,
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
