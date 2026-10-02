import cors from 'cors';
import express from 'express';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import api from './modules/index.js';

const app = express();

app.use(cors({
  origin: env.clientOrigin,
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', api);

app.use(notFound);

app.use(errorHandler);

export default app;
