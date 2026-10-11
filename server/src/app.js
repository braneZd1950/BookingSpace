import cors from 'cors';
import express from 'express';
import path from 'path';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import api from './modules/index.js';

const app = express();

const allowedOrigins = new Set(
  [
    env.clientOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
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

app.use(notFound);

app.use(errorHandler);

export default app;
