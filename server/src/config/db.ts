import mongoose from 'mongoose';
import { env, isProduction } from './env';

let memoryServer: { stop: () => Promise<unknown> } | null = null;

export async function connectDatabase(): Promise<string> {
  let uri = env.mongoUri;

  if (!uri) {
    if (isProduction) {
      throw new Error('MONGO_URI is required in production.');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    memoryServer = mem;
    uri = mem.getUri('todoapp');
    console.warn('[db] MONGO_URI is empty, falling back to an in-memory MongoDB. Data will not persist.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  return uri;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
