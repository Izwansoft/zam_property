import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from '../infrastructure/redis';
import { QueueService } from '../infrastructure/queue';
import { CacheService } from '../infrastructure/cache';
import { TypedConfigService } from '../config';

/**
 * Health check controller for infrastructure services.
 * Provides endpoints to check Redis, queue, cache, and config health.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService,
    private readonly configService: TypedConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis connection status' })
  async getRedisHealth() {
    const isHealthy = await this.redisService.isHealthy();
    return {
      status: isHealthy ? 'ok' : 'error',
      connected: isHealthy,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('queues')
  @ApiOperation({ summary: 'Queue health check' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getQueuesHealth() {
    const stats = await this.queueService.getAllQueuesStats();
    return {
      status: 'ok',
      queues: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cache')
  @ApiOperation({ summary: 'Cache health check' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  async getCacheHealth() {
    const memoryStats = this.cacheService.getMemoryStats();
    const isRedisHealthy = await this.redisService.isHealthy();

    return {
      status: isRedisHealthy ? 'ok' : 'degraded',
      memory: {
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        keys: memoryStats.keys,
        hitRate:
          memoryStats.hits + memoryStats.misses > 0
            ? ((memoryStats.hits / (memoryStats.hits + memoryStats.misses)) * 100).toFixed(2) + '%'
            : 'N/A',
      },
      redis: {
        connected: isRedisHealthy,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Configuration health check' })
  @ApiResponse({ status: 200, description: 'Configuration status (sensitive values masked)' })
  getConfigHealth() {
    const secretsValidation = this.configService.validateSecrets();
    const summary = this.configService.getConfigSummary();

    return {
      status: secretsValidation.valid ? 'ok' : 'warning',
      config: summary,
      validation: {
        valid: secretsValidation.valid,
        warnings: secretsValidation.warnings,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
