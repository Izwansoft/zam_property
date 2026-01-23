import { registerAs } from '@nestjs/config';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class AppConfigDto {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsNotEmpty()
  APP_NAME: string = 'zam-property-api';

  @IsInt()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  API_PREFIX: string = 'api/v1';

  @Transform(({ value }) => value === 'true' || value === true)
  SWAGGER_ENABLED: boolean = true;

  @IsString()
  LOG_LEVEL: string = 'info';
}

export interface AppConfig {
  nodeEnv: Environment;
  name: string;
  port: number;
  apiPrefix: string;
  swaggerEnabled: boolean;
  logLevel: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: (process.env.NODE_ENV as Environment) || Environment.Development,
    name: process.env.APP_NAME || 'zam-property-api',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    isDevelopment: process.env.NODE_ENV === Environment.Development,
    isProduction: process.env.NODE_ENV === Environment.Production,
    isTest: process.env.NODE_ENV === Environment.Test,
  }),
);
