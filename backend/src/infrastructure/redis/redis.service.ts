import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis service for managing Redis connections.
 * Provides a shared Redis client for caching, queues, and pub/sub.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const db = this.configService.get<number>('REDIS_DB', 0);

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 10) {
          this.logger.error('Redis connection failed after 10 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis client error: ${error.message}`);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });
  }

  /**
   * Get the Redis client instance.
   * Use this for direct Redis operations.
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Check if Redis is connected and ready.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Get Redis connection options for BullMQ.
   */
  getConnectionOptions(): { host: string; port: number; password?: string; db?: number } {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      db: this.configService.get<number>('REDIS_DB', 0),
    };
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection');
    await this.client.quit();
  }
}
