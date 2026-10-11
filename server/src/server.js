import app from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import env from './config/env.js';
import { verifyMail } from './utils/mail.js';

let server;

async function start() {
  await connectDb();
  const mail = await verifyMail();
  console.log(`[mail] ${mail.message}`);

  server = app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);

  if (!server) {
    await disconnectDb();
    process.exit(0);
  }

  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

start().catch((error) => {
  console.error('Failed to start API');
  console.error(error.message);
  process.exit(1);
});
