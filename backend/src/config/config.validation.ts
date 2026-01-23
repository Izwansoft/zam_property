import * as Joi from 'joi';

/**
 * Joi validation schema for environment variables.
 * Validates all required configuration at application startup.
 * If validation fails, the application will not start.
 */
export const configValidationSchema = Joi.object({
  // App Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('zam-property-api'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  SWAGGER_ENABLED: Joi.boolean().default(true),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),

  // Database Configuration
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // Redis Configuration (URL or individual settings)
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().min(0).max(15).default(0),

  // JWT Configuration
  JWT_ACCESS_TOKEN_SECRET: Joi.string().min(16).required().messages({
    'string.min': 'JWT_ACCESS_TOKEN_SECRET must be at least 16 characters for security',
    'any.required': 'JWT_ACCESS_TOKEN_SECRET is required',
  }),
  JWT_ACCESS_TOKEN_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m'),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().min(16).required().messages({
    'string.min': 'JWT_REFRESH_TOKEN_SECRET must be at least 16 characters for security',
    'any.required': 'JWT_REFRESH_TOKEN_SECRET is required',
  }),
  JWT_REFRESH_TOKEN_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('30d'),

  // OpenSearch Configuration
  OPENSEARCH_NODE: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:9200'),
  OPENSEARCH_USERNAME: Joi.string().allow('').optional(),
  OPENSEARCH_PASSWORD: Joi.string().allow('').optional(),

  // S3 Configuration
  S3_ENDPOINT: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  S3_REGION: Joi.string().default('ap-southeast-1'),
  S3_BUCKET: Joi.string().default('zam-property'),
  S3_ACCESS_KEY_ID: Joi.string().optional(),
  S3_SECRET_ACCESS_KEY: Joi.string().optional(),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(false),

  // Socket.IO Configuration
  SOCKET_IO_REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),

  // BullMQ Configuration
  BULLMQ_REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .optional(),

  // CORS Configuration
  CORS_ORIGIN: Joi.string().optional(),
}).options({
  allowUnknown: true, // Allow other env vars not defined here
  abortEarly: false, // Report all errors, not just the first
});
