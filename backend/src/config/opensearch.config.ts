import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';

export class OpenSearchConfigDto {
  @IsString()
  OPENSEARCH_NODE: string = 'http://localhost:9200';

  @IsString()
  @IsOptional()
  OPENSEARCH_USERNAME?: string;

  @IsString()
  @IsOptional()
  OPENSEARCH_PASSWORD?: string;
}

export interface OpenSearchConfig {
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  ssl: boolean;
  requestTimeout: number;
  maxRetries: number;
}

export const openSearchConfig = registerAs('openSearch', (): OpenSearchConfig => {
  const node = process.env.OPENSEARCH_NODE || 'http://localhost:9200';
  const username = process.env.OPENSEARCH_USERNAME;
  const password = process.env.OPENSEARCH_PASSWORD;

  return {
    node,
    auth:
      username && password
        ? {
            username,
            password,
          }
        : undefined,
    ssl: node.startsWith('https'),
    requestTimeout: 30000,
    maxRetries: 3,
  };
});
