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

bootstrap().catch((error) => {
  console.error('[api] failed to start', error);
  process.exit(1);
});
