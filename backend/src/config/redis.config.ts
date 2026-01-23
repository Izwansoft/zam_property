import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class RedisConfigDto {
  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsInt()
  @Min(0)
  @Max(15)
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_DB: number = 0;
}

export interface RedisConfig {
  url?: string;
  host: string;
  port: number;
  password?: string;
  db: number;
  tls: boolean;
}

/**
 * Parse REDIS_URL to extract components
 * Format: redis://[:password@]host:port[/db]
 */
function parseRedisUrl(
  url: string,
): Pick<RedisConfig, 'host' | 'port' | 'password' | 'db' | 'tls'> | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const pathDb = parsed.pathname.slice(1);

    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      db: pathDb ? parseInt(pathDb, 10) : 0,
      tls: parsed.protocol === 'rediss:',
    };
  } catch {
    return null;
  }
}

export const redisConfig = registerAs('redis', (): RedisConfig => {
  const url = process.env.REDIS_URL;
  const fromUrl = parseRedisUrl(url || '');

  if (fromUrl) {
    return {
      url,
      ...fromUrl,
    };
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: false,
  };
});
