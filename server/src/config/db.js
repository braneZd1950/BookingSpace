import mongoose from 'mongoose';
import env from './env.js';

// Do NOT enable global sanitizeFilter — it wraps intentional operators like
// date: { $gte/$lte }. User-controlled scalars are constrained with $eq at call sites
// and Express query parser is set to "simple".

export async function connectDb() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
