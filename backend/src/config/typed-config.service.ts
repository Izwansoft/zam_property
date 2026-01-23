import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig, Environment } from './app.config';
import { DatabaseConfig } from './database.config';
import { RedisConfig } from './redis.config';
import { JwtConfig } from './jwt.config';
import { OpenSearchConfig } from './opensearch.config';
import { S3Config } from './s3.config';
import { CorsConfig } from './cors.config';

/**
 * Secrets management patterns for sensitive configuration.
 * This service provides utilities for masking and handling secrets.
 */

// Fields that should be masked in logs and health endpoints
const SENSITIVE_FIELDS = [
  'secret',
  'password',
  'key',
  'token',
  'credential',
  'accessKey',
  'secretKey',
];

/**
 * Check if a field name indicates sensitive data
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some((sensitive) => lowerField.includes(sensitive.toLowerCase()));
}

/**
 * Mask a sensitive value for display
 */
export function maskSecret(value: string | undefined, visibleChars: number = 4): string {
  if (!value) return '(not set)';
  if (value.length <= visibleChars * 2) return '****';
  return `${value.slice(0, visibleChars)}${'*'.repeat(8)}${value.slice(-visibleChars)}`;
}

/**
 * Recursively mask sensitive fields in an object
 */
export function maskSecrets<T extends object>(obj: T, path: string = ''): T {
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (value === null || value === undefined) {
      masked[key] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      masked[key] = maskSecrets(value as object, currentPath);
    } else if (typeof value === 'string' && isSensitiveField(key)) {
      masked[key] = maskSecret(value);
    } else {
      masked[key] = value;
    }
  }

  return masked as T;
}

/**
 * Type-safe configuration service that provides access to all config namespaces.
 */
@Injectable()
export class TypedConfigService {
  private readonly logger = new Logger(TypedConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  get app(): AppConfig {
    return this.configService.getOrThrow<AppConfig>('app');
  }

  get database(): DatabaseConfig {
    return this.configService.getOrThrow<DatabaseConfig>('database');
  }

  get redis(): RedisConfig {
    return this.configService.getOrThrow<RedisConfig>('redis');
  }

  get jwt(): JwtConfig {
    return this.configService.getOrThrow<JwtConfig>('jwt');
  }

  get openSearch(): OpenSearchConfig {
    return this.configService.getOrThrow<OpenSearchConfig>('openSearch');
  }

  get s3(): S3Config {
    return this.configService.getOrThrow<S3Config>('s3');
  }

  get cors(): CorsConfig {
    return this.configService.getOrThrow<CorsConfig>('cors');
  }

  /**
   * Check if running in development mode
   */
  get isDevelopment(): boolean {
    return this.app.nodeEnv === Environment.Development;
  }

  /**
   * Check if running in production mode
   */
  get isProduction(): boolean {
    return this.app.nodeEnv === Environment.Production;
  }

  /**
   * Check if running in test mode
   */
  get isTest(): boolean {
    return this.app.nodeEnv === Environment.Test;
  }

  /**
   * Get a raw environment variable value
   */
  getEnv<T = string>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue as T) as T;
  }

  /**
   * Get configuration summary for health checks (secrets masked)
   */
  getConfigSummary(): Record<string, unknown> {
    return maskSecrets({
      app: {
        name: this.app.name,
        environment: this.app.nodeEnv,
        port: this.app.port,
        apiPrefix: this.app.apiPrefix,
        swaggerEnabled: this.app.swaggerEnabled,
        logLevel: this.app.logLevel,
      },
      database: {
        host: this.database.host,
        port: this.database.port,
        database: this.database.database,
        ssl: this.database.ssl,
      },
      redis: {
        host: this.redis.host,
        port: this.redis.port,
        db: this.redis.db,
        tls: this.redis.tls,
      },
      jwt: {
        accessTokenTtl: this.jwt.accessToken.ttl,
        refreshTokenTtl: this.jwt.refreshToken.ttl,
      },
      openSearch: {
        node: this.openSearch.node,
        hasAuth: !!this.openSearch.auth,
      },
      s3: {
        region: this.s3.region,
        bucket: this.s3.bucket,
        hasEndpoint: !!this.s3.endpoint,
        forcePathStyle: this.s3.forcePathStyle,
      },
      cors: {
        origin: this.cors.origin === true ? '*' : this.cors.origin,
        credentials: this.cors.credentials,
      },
    });
  }

  /**
   * Validate that required secrets are properly set (not defaults)
   */
  validateSecrets(): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check JWT secrets
    if (
      this.jwt.accessToken.secret === 'change-me-access' ||
      this.jwt.refreshToken.secret === 'change-me-refresh'
    ) {
      warnings.push('JWT secrets are using default values. Change them in production!');
    }

    // Check for short secrets in production
    if (this.isProduction) {
      if (this.jwt.accessToken.secret.length < 32) {
        warnings.push('JWT_ACCESS_TOKEN_SECRET should be at least 32 characters in production');
      }
      if (this.jwt.refreshToken.secret.length < 32) {
        warnings.push('JWT_REFRESH_TOKEN_SECRET should be at least 32 characters in production');
      }
    }

    // Log warnings in development
    if (!this.isProduction && warnings.length > 0) {
      warnings.forEach((w) => this.logger.warn(w));
    }

    return {
      valid: this.isProduction ? warnings.length === 0 : true,
      warnings,
    };
  }
}
