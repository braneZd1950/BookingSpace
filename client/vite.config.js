import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const clientDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(clientDir, '..'),
  resolve: {
    alias: {
      '@shared': path.resolve(clientDir, '../shared'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(clientDir, '..')],
    },
    host: true,
    port: 5173,
    proxy: {
      // BookingApp API (default 4001 — 4000 often zauzme drugi lokalni projekt)
      '/api': 'http://localhost:4001',
      '/uploads': 'http://localhost:4001',
    },
  },
});

