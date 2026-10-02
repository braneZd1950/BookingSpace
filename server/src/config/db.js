import mongoose from 'mongoose';
import env from './env.js';

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
