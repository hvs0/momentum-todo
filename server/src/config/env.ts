import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGO_URI ?? '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL ?? '30d',
  },
};

export const isProduction = env.nodeEnv === 'production';

const PLACEHOLDER_SECRETS = ['dev-access-secret-change-me', 'dev-refresh-secret-change-me'];

export function assertProductionSafety(): void {
  if (!isProduction) return;

  if (
    PLACEHOLDER_SECRETS.includes(env.jwt.accessSecret) ||
    PLACEHOLDER_SECRETS.includes(env.jwt.refreshSecret)
  ) {
    throw new Error('JWT secrets are still set to the development placeholders.');
  }

  if (!env.mongoUri) {
    throw new Error('MONGO_URI must be set in production.');
  }
}
