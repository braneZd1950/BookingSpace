import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import api from './modules/index.js';

const app = express();
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const allowedOrigins = new Set(
  [
    ...env.clientOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ].filter(Boolean),
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', api);

const clientDist = resolveClientDist();
if (clientDist) {
  console.log(`[web] serving SPA from ${clientDist}`);
  app.use(express.static(clientDist, { index: false, fallthrough: true }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.use(notFound);

app.use(errorHandler);

function resolveClientDist() {
  if (env.serveClient === 'false') return null;

  const candidates = [
    env.clientDist,
    path.join(serverRoot, 'public'),
    path.join(serverRoot, '..', 'client', 'dist'),
    path.join(process.cwd(), 'client', 'dist'),
    path.join(process.cwd(), '..', 'client', 'dist'),
  ].filter(Boolean);

  for (const dir of candidates) {
    const resolved = path.resolve(dir);
    if (fs.existsSync(path.join(resolved, 'index.html'))) {
      return resolved;
    }
  }

  if (env.serveClient === 'true') {
    console.warn('[web] SERVE_CLIENT=true but client/dist (index.html) was not found');
  }
  return null;
}

export default app;
