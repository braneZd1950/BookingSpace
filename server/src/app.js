import cors from 'cors';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import api from './modules/index.js';
import { HttpError } from './utils/httpError.js';

const app = express();
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Render / reverse proxies: needed for correct client IP on rate limits.
if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const localDevOrigins = env.nodeEnv === 'production'
  ? []
  : [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    // Expo Metro / Expo web (native app UI)
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://localhost:8083',
    'http://127.0.0.1:8083',
  ];

const allowedOrigins = new Set(
  [
    ...env.clientOrigins,
    ...localDevOrigins,
  ].filter(Boolean),
);

function isLocalExpoOrigin(origin) {
  if (env.nodeEnv === 'production' || !origin) return false;
  try {
    const url = new URL(origin);
    const localHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    return localHost && port >= 8081 && port <= 8099;
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isLocalExpoOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', (req, res, next) => {
  // Paid / membership videos must never be world-readable via static paths.
  if (String(req.path || '').includes('/video/')) {
    next(new HttpError(404, 'Not found', { code: 'NOT_FOUND' }));
    return;
  }
  next();
}, express.static(path.resolve(process.cwd(), 'uploads'), {
  fallthrough: true,
  index: false,
}));

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
