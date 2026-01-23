import { Global, Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';
import { jwtConfig } from './jwt.config';
import { openSearchConfig } from './opensearch.config';
import { s3Config } from './s3.config';
import { corsConfig } from './cors.config';
import { configValidationSchema } from './config.validation';
import { TypedConfigService } from './typed-config.service';

/**
 * Application Configuration Module
 *
 * This module provides:
 * - Typed configuration classes for each domain (app, database, redis, etc.)
 * - Startup validation using Joi schema
 * - Environment-specific configuration support
 * - Secrets management patterns
 *
 * Configuration is validated at startup. If validation fails, the app won't start.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true, // Cache config values for performance
      expandVariables: true, // Support ${VAR} syntax in .env files
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        openSearchConfig,
        s3Config,
        corsConfig,
      ],
    }),
  ],
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class AppConfigModule implements OnModuleInit {
  private readonly logger = new Logger(AppConfigModule.name);

  constructor(private readonly config: TypedConfigService) {}

  onModuleInit(): void {
    const app = this.config.app;

    this.logger.log(`Configuration loaded for environment: ${app.nodeEnv}`);
    this.logger.log(`Application: ${app.name} on port ${app.port}`);
    this.logger.log(`API Prefix: ${app.apiPrefix}`);
    this.logger.log(`Swagger: ${app.swaggerEnabled ? 'enabled' : 'disabled'}`);

    // Validate secrets
    const secretsValidation = this.config.validateSecrets();
    if (!secretsValidation.valid) {
      throw new Error(`Configuration validation failed: ${secretsValidation.warnings.join(', ')}`);
    }

    // Log database connection info (masked)
    const db = this.config.database;
    this.logger.log(`Database: ${db.host}:${db.port}/${db.database}`);

    // Log Redis connection info
    const redis = this.config.redis;
    this.logger.log(`Redis: ${redis.host}:${redis.port}/${redis.db}`);
  }
}
