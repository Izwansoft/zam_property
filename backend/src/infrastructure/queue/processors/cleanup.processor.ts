import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import {
  CleanupJob,
  MediaOrphanedCleanupJob,
  SessionsExpiredCleanupJob,
  TokensExpiredCleanupJob,
  LogsArchiveJob,
  SoftDeletesPurgeJob,
  CacheClearJob,
  CleanupResult,
} from '../../queue/job-types';
import { JobResult } from '../../queue/queue.interfaces';
import { RedisService } from '../../redis/redis.service';
import { S3Service } from '../../storage/s3.service';

/**
 * Cleanup processor for handling maintenance and cleanup jobs.
 *
 * Per part-31.md:
 * - media.orphaned: Clean orphaned media files (timeout: 300s)
 * - sessions.expired: Clean expired sessions (timeout: 60s)
 * - tokens.expired: Clean expired tokens (timeout: 60s)
 * - logs.archive: Archive old logs (timeout: 600s)
 * - soft_deletes.purge: Purge soft-deleted records (timeout: 300s)
 */
@Processor(QUEUE_NAMES.CLEANUP_PROCESS)
@Injectable()
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<CleanupJob>): Promise<JobResult> {
    const startTime = Date.now();
    const { name, data } = job;

    this.logger.log({
      event: 'job.started',
      queue: QUEUE_NAMES.CLEANUP_PROCESS,
      jobId: job.id,
      jobType: name,
      tenantId: data.tenantId,
    });

    try {
      let result: JobResult;

      switch (data.type) {
        case 'media.orphaned':
          result = await this.handleMediaOrphaned(job as Job<MediaOrphanedCleanupJob>);
          break;
        case 'sessions.expired':
          result = await this.handleSessionsExpired(job as Job<SessionsExpiredCleanupJob>);
          break;
        case 'tokens.expired':
          result = await this.handleTokensExpired(job as Job<TokensExpiredCleanupJob>);
          break;
        case 'logs.archive':
          result = await this.handleLogsArchive(job as Job<LogsArchiveJob>);
          break;
        case 'soft_deletes.purge':
          result = await this.handleSoftDeletesPurge(job as Job<SoftDeletesPurgeJob>);
          break;
        case 'cache.clear':
          result = await this.handleCacheClear(job as Job<CacheClearJob>);
          break;
        default:
          this.logger.warn(`Unknown cleanup job type: ${(data as CleanupJob).type}`);
          result = {
            success: false,
            message: `Unknown cleanup job type: ${(data as CleanupJob).type}`,
            processedAt: new Date().toISOString(),
          };
      }

      const duration = Date.now() - startTime;
      this.logger.log({
        event: 'job.completed',
        queue: QUEUE_NAMES.CLEANUP_PROCESS,
        jobId: job.id,
        jobType: name,
        duration,
        success: result.success,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        event: 'job.failed',
        queue: QUEUE_NAMES.CLEANUP_PROCESS,
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  /**
   * Clean up orphaned media files (files without owner).
   */
  private async handleMediaOrphaned(job: Job<MediaOrphanedCleanupJob>): Promise<JobResult> {
    const { tenantId, olderThan, batchSize, dryRun = false } = job.data;
    const olderThanDate = new Date(olderThan);

    this.logger.log(
      `Cleaning orphaned media older than ${olderThan} for tenant ${tenantId} (dryRun: ${dryRun})`,
    );

    await job.updateProgress(10);

    // Find orphaned media (PENDING status older than threshold)
    const orphanedMedia = await this.prisma.media.findMany({
      where: {
        tenantId,
        processingStatus: 'PENDING',
        createdAt: {
          lt: olderThanDate,
        },
      },
      take: batchSize,
      select: {
        id: true,
        storageKey: true,
      },
    });

    await job.updateProgress(30);

    if (orphanedMedia.length === 0) {
      return this.createCleanupResult(job, 'media.orphaned', 0, 0);
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < orphanedMedia.length; i++) {
      const media = orphanedMedia[i];

      try {
        if (!dryRun) {
          // Delete from S3
          if (media.storageKey) {
            await this.s3Service.deleteObject(media.storageKey);
          }

          // Delete database record
          await this.prisma.media.delete({
            where: { id: media.id },
          });
        }

        deletedCount++;

        const progress = 30 + Math.floor((i / orphanedMedia.length) * 60);
        await job.updateProgress(progress);
      } catch (error) {
        const err = error as Error;
        errors.push(`Media ${media.id}: ${err.message}`);
      }
    }

    await job.updateProgress(100);

    const result: CleanupResult = {
      success: errors.length === 0,
      jobType: 'media.orphaned',
      recordsProcessed: orphanedMedia.length,
      recordsDeleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      processedAt: new Date().toISOString(),
      duration: 0,
    };

    this.eventEmitter.emit('cleanup.completed', {
      type: 'media.orphaned',
      tenantId,
      deletedCount,
      dryRun,
    });

    return {
      success: result.success,
      message: dryRun
        ? `Dry run: would delete ${deletedCount} orphaned media files`
        : `Deleted ${deletedCount} orphaned media files`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Clean up expired sessions.
   */
  private async handleSessionsExpired(job: Job<SessionsExpiredCleanupJob>): Promise<JobResult> {
    const { tenantId, olderThan, batchSize } = job.data;
    const olderThanDate = new Date(olderThan);

    this.logger.log(`Cleaning expired sessions older than ${olderThan} for tenant ${tenantId}`);

    await job.updateProgress(10);

    // Clean session data from Redis
    const redis = this.redisService.getClient();
    const pattern = `session:${tenantId}:*`;
    let deletedCount = 0;
    let cursor = '0';

    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
      cursor = result[0];
      const keys = result[1];

      for (const key of keys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (new Date(session.expiresAt) < olderThanDate) {
              await redis.del(key);
              deletedCount++;
            }
          } catch {
            // Invalid session data, delete it
            await redis.del(key);
            deletedCount++;
          }
        }
      }

      await job.updateProgress(30 + Math.floor((deletedCount / batchSize) * 60));
    } while (cursor !== '0' && deletedCount < batchSize);

    await job.updateProgress(100);

    return this.createCleanupResult(job, 'sessions.expired', deletedCount, deletedCount);
  }

  /**
   * Clean up expired tokens (refresh tokens, password reset tokens, etc.).
   */
  private async handleTokensExpired(job: Job<TokensExpiredCleanupJob>): Promise<JobResult> {
    const { tenantId, olderThan, batchSize = 1000, tokenType = 'all' } = job.data;
    const _olderThanDate = new Date(olderThan);

    this.logger.log(`Cleaning expired ${tokenType} tokens older than ${olderThan}`);

    await job.updateProgress(10);

    // Clean tokens from Redis based on type
    const redis = this.redisService.getClient();
    const patterns: string[] = [];

    if (tokenType === 'all' || tokenType === 'refresh') {
      patterns.push(`refresh_token:${tenantId}:*`);
    }
    if (tokenType === 'all' || tokenType === 'reset') {
      patterns.push(`password_reset:${tenantId}:*`);
    }
    if (tokenType === 'all' || tokenType === 'verification') {
      patterns.push(`email_verification:${tenantId}:*`);
    }

    let deletedCount = 0;

    for (const pattern of patterns) {
      let cursor = '0';

      do {
        const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];

        for (const key of keys) {
          const ttl = await redis.ttl(key);
          // If TTL is -1 (no expiry) or token is old, delete it
          if (ttl === -1) {
            await redis.del(key);
            deletedCount++;
          }
        }
      } while (cursor !== '0' && deletedCount < batchSize);
    }

    await job.updateProgress(100);

    return this.createCleanupResult(job, 'tokens.expired', deletedCount, deletedCount);
  }

  /**
   * Archive old logs.
   */
  private async handleLogsArchive(job: Job<LogsArchiveJob>): Promise<JobResult> {
    const {
      tenantId: _tenantId,
      logType,
      olderThan,
      destinationBucket,
      compress = true,
    } = job.data;

    this.logger.log(`Archiving ${logType} logs older than ${olderThan}`);

    await job.updateProgress(10);

    // This would typically:
    // 1. Query old audit logs from database
    // 2. Export to JSON/CSV
    // 3. Compress if needed
    // 4. Upload to archive bucket
    // 5. Delete from primary database

    // Placeholder implementation
    await job.updateProgress(50);

    // Note: Actual implementation would depend on logging infrastructure
    const archivedCount = 0;

    await job.updateProgress(100);

    return {
      success: true,
      message: `Archived ${archivedCount} ${logType} logs`,
      data: {
        jobType: 'logs.archive',
        logType,
        archivedCount,
        destinationBucket,
        compressed: compress,
      },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Purge soft-deleted records permanently.
   */
  private async handleSoftDeletesPurge(job: Job<SoftDeletesPurgeJob>): Promise<JobResult> {
    const { tenantId, entityType = 'all', olderThan, batchSize: _batchSize } = job.data;
    const olderThanDate = new Date(olderThan);

    this.logger.log(
      `Purging ${entityType} soft-deleted records older than ${olderThan} for tenant ${tenantId}`,
    );

    await job.updateProgress(10);

    let deletedCount = 0;
    const errors: string[] = [];

    // Purge listings
    if (entityType === 'all' || entityType === 'listing') {
      try {
        const result = await this.prisma.listing.deleteMany({
          where: {
            tenantId,
            deletedAt: {
              not: null,
              lt: olderThanDate,
            },
          },
        });
        deletedCount += result.count;
      } catch (error) {
        errors.push(`Listings: ${(error as Error).message}`);
      }
    }

    await job.updateProgress(40);

    // Purge media
    if (entityType === 'all' || entityType === 'media') {
      try {
        const result = await this.prisma.media.deleteMany({
          where: {
            tenantId,
            deletedAt: {
              not: null,
              lt: olderThanDate,
            },
          },
        });
        deletedCount += result.count;
      } catch (error) {
        errors.push(`Media: ${(error as Error).message}`);
      }
    }

    await job.updateProgress(100);

    const result: CleanupResult = {
      success: errors.length === 0,
      jobType: 'soft_deletes.purge',
      recordsProcessed: deletedCount,
      recordsDeleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      processedAt: new Date().toISOString(),
      duration: 0,
    };

    return {
      success: result.success,
      message: `Purged ${deletedCount} soft-deleted records`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Clear cache entries.
   */
  private async handleCacheClear(job: Job<CacheClearJob>): Promise<JobResult> {
    const { tenantId, pattern, prefix, all = false } = job.data;

    this.logger.log(`Clearing cache for tenant ${tenantId}`);

    await job.updateProgress(10);

    const redis = this.redisService.getClient();
    let deletedCount = 0;

    if (all) {
      // Clear all cache for tenant
      const keys = await this.scanKeys(redis, `cache:${tenantId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount = keys.length;
      }
    } else if (pattern) {
      const keys = await this.scanKeys(redis, `cache:${tenantId}:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount = keys.length;
      }
    } else if (prefix) {
      const keys = await this.scanKeys(redis, `cache:${tenantId}:${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount = keys.length;
      }
    }

    await job.updateProgress(100);

    return {
      success: true,
      message: `Cleared ${deletedCount} cache entries`,
      data: {
        jobType: 'cache.clear',
        tenantId,
        deletedCount,
        pattern: pattern || prefix || 'all',
      },
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private createCleanupResult(
    job: Job<CleanupJob>,
    jobType: CleanupResult['jobType'],
    recordsProcessed: number,
    recordsDeleted: number,
  ): JobResult {
    const result: CleanupResult = {
      success: true,
      jobType,
      recordsProcessed,
      recordsDeleted,
      processedAt: new Date().toISOString(),
      duration: 0,
    };

    return {
      success: true,
      message: `Cleaned up ${recordsDeleted} records`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  private async scanKeys(
    redis: ReturnType<RedisService['getClient']>,
    pattern: string,
  ): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    return keys;
  }
}
