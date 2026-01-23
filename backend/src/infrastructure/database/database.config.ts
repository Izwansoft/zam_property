import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
}

export const databaseConfig = registerAs('database', (): DatabaseConfig => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  return { url };
});
