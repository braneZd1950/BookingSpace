import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const mobileDir = path.dirname(fileURLToPath(import.meta.url));
const clientSrc = path.resolve(mobileDir, '../client/src');
const repoRoot = path.resolve(mobileDir, '..');

export default defineConfig({
  plugins: [react()],
  envDir: repoRoot,
  define: {
    'import.meta.env.VITE_APP_SHELL': JSON.stringify('mobile'),
  },
  resolve: {
    alias: {
      '@client': clientSrc,
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Pages live under client/src; keep relative scss imports working.
      },
    },
  },
});
