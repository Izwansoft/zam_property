import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';

export class CorsConfigDto {
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;
}

export interface CorsConfig {
  origin: string | string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
}

export const corsConfig = registerAs('cors', (): CorsConfig => {
  const origin = process.env.CORS_ORIGIN;

  // Parse origin - supports comma-separated list or single origin
  let parsedOrigin: string | string[] | boolean;
  if (!origin || origin === '*') {
    parsedOrigin = true; // Allow all origins (development)
  } else if (origin.includes(',')) {
    parsedOrigin = origin.split(',').map((o) => o.trim());
  } else {
    parsedOrigin = origin;
  }

  return {
    origin: parsedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Request-ID',
      'X-Api-Version',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400, // 24 hours
  };
});
