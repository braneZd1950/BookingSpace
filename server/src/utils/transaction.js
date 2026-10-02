import mongoose from 'mongoose';

function isUnsupportedTransaction(error) {
  const message = String(error?.message || '');
  return message.includes('replica set') || message.includes('Transaction numbers');
}

export function sessionOptions(session) {
  return session ? { session } : {};
}

export async function createDoc(Model, data, session) {
  if (!session) return Model.create(data);
  const [doc] = await Model.create([data], { session });
  return doc;
}

export async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (!isUnsupportedTransaction(error)) throw error;
  } finally {
    await session.endSession();
  }

  return work(null);
}
