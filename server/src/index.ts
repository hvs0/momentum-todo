import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { assertProductionSafety, env } from './config/env';

async function bootstrap() {
  assertProductionSafety();

  await connectDatabase();
  console.log('[db] connected');

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}/api`);
    console.log('[api] android emulator should use http://10.0.2.2:' + env.port + '/api');
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[api] ${signal} received, shutting down`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  console.error('[api] STARTUP FAILED: ' + message);

  if (lowered.includes('econnrefused') || lowered.includes('etimedout') || lowered.includes('server selection')) {
    console.error('[api] The database refused the connection.');
    console.error('[api] In MongoDB Atlas open Network Access and allow 0.0.0.0/0 so the host can reach it.');
  }

  if (lowered.includes('authentication failed') || lowered.includes('bad auth')) {
    console.error('[api] The database rejected the credentials. Check the user and password in MONGO_URI.');
  }

  process.exit(1);
});
