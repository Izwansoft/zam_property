import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';

export class DatabaseConfigDto {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;
}

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
}

/**
 * Parse DATABASE_URL to extract components
 * Format: postgresql://user:password@host:port/database?schema=public
 */
function parseDatabaseUrl(url: string): Omit<DatabaseConfig, 'url'> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname.slice(1).split('?')[0],
      username: parsed.username,
      ssl: parsed.searchParams.get('sslmode') === 'require',
    };
  } catch {
    return {
      host: 'localhost',
      port: 5432,
      database: 'zam_property',
      username: 'postgres',
      ssl: false,
    };
  }
}

export const databaseConfig = registerAs('database', (): DatabaseConfig => {
  const url = process.env.DATABASE_URL || '';
  const parsed = parseDatabaseUrl(url);

  return {
    url,
    ...parsed,
  };
});
