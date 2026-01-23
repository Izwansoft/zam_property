import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';

export class JwtConfigDto {
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_TOKEN_SECRET!: string;

  @IsString()
  JWT_ACCESS_TOKEN_TTL: string = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_TOKEN_SECRET!: string;

  @IsString()
  JWT_REFRESH_TOKEN_TTL: string = '30d';
}

export interface JwtConfig {
  accessToken: {
    secret: string;
    ttl: string;
    ttlMs: number;
  };
  refreshToken: {
    secret: string;
    ttl: string;
    ttlMs: number;
  };
}

/**
 * Parse duration string to milliseconds
 * Supports: 15m, 1h, 7d, 30d, etc.
 */
function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

export const jwtConfig = registerAs('jwt', (): JwtConfig => {
  const accessTtl = process.env.JWT_ACCESS_TOKEN_TTL || '15m';
  const refreshTtl = process.env.JWT_REFRESH_TOKEN_TTL || '30d';

  return {
    accessToken: {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'change-me-access',
      ttl: accessTtl,
      ttlMs: parseDurationToMs(accessTtl),
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'change-me-refresh',
      ttl: refreshTtl,
      ttlMs: parseDurationToMs(refreshTtl),
    },
  };
});
