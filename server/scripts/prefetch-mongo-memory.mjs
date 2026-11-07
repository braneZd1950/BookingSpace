/**
 * Download the mongodb-memory-server binary once before parallel tests.
 * Avoids ENOENT rename races when many test files call MongoMemoryServer.create().
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const server = await MongoMemoryServer.create();
await server.stop();
console.log('[prefetch-mongo-memory] binary ready');
