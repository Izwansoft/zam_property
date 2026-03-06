import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import {
  ListingExpireJob,
  ListingCheckExpiredJob,
  ListingExpireSingleJob,
  ListingExpireBatchJob,
  ListingRenewJob,
  ListingExpirationResult,
} from '../../queue/job-types';
import { JobResult } from '../../queue/queue.interfaces';

/**
 * Listing expiration processor for handling listing lifecycle jobs.
 *
 * Job types:
 * - listing.check_expired: Scheduled job to find and expire listings past expiresAt
 * - listing.expire_single: Expire a single listing
 * - listing.expire_batch: Expire multiple listings in batch
 * - listing.renew: Renew an expired listing
 */
@Processor('listing.expire')
@Injectable()
export class ListingExpireProcessor extends WorkerHost {
  private readonly logger = new Logger(ListingExpireProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<ListingExpireJob>): Promise<JobResult> {
    const startTime = Date.now();
    const { name, data } = job;

    this.logger.log({
      event: 'job.started',
      queue: 'listing.expire',
      jobId: job.id,
      jobType: name,
      partnerId: data.partnerId,
    });

    try {
      let result: JobResult;

      switch (data.type) {
        case 'listing.check_expired':
          result = await this.handleCheckExpired(job as Job<ListingCheckExpiredJob>);
          break;
        case 'listing.expire_single':
          result = await this.handleExpireSingle(job as Job<ListingExpireSingleJob>);
          break;
        case 'listing.expire_batch':
          result = await this.handleExpireBatch(job as Job<ListingExpireBatchJob>);
          break;
        case 'listing.renew':
          result = await this.handleRenew(job as Job<ListingRenewJob>);
          break;
        default:
          this.logger.warn(`Unknown job type: ${(data as ListingExpireJob).type}`);
          result = {
            success: false,
            message: `Unknown job type: ${(data as ListingExpireJob).type}`,
            processedAt: new Date().toISOString(),
          };
      }

      this.logger.log({
        event: 'job.completed',
        queue: 'listing.expire',
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        success: result.success,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        event: 'job.failed',
        queue: 'listing.expire',
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
   * Check for expired listings and expire them.
   * This is a scheduled job that runs periodically.
   */
  private async handleCheckExpired(job: Job<ListingCheckExpiredJob>): Promise<JobResult> {
    const { partnerId, checkDate, batchSize = 100 } = job.data;
    const checkDateTime = new Date(checkDate);

    this.logger.log(`Checking for expired listings as of ${checkDate} for partner ${partnerId}`);

    await job.updateProgress(10);

    // Find all PUBLISHED listings that have expired
    const expiredListings = await this.prisma.listing.findMany({
      where: {
        partnerId,
        status: ListingStatus.PUBLISHED,
        expiresAt: {
          lte: checkDateTime,
        },
      },
      select: {
        id: true,
        title: true,
        vendorId: true,
      },
      take: batchSize,
    });

    await job.updateProgress(30);

    if (expiredListings.length === 0) {
      this.logger.log(`No expired listings found for partner ${partnerId}`);
      return {
        success: true,
        message: 'No expired listings found',
        data: { expiredCount: 0, partnerId },
        processedAt: new Date().toISOString(),
      };
    }

    this.logger.log(`Found ${expiredListings.length} expired listings for partner ${partnerId}`);

    // Expire all listings in a transaction
    const listingIds = expiredListings.map((l) => l.id);
    let expiredCount = 0;
    const errors: Array<{ listingId: string; error: string }> = [];

    for (let i = 0; i < listingIds.length; i++) {
      const listingId = listingIds[i];
      try {
        await this.expireListing(partnerId, listingId, 'Automatic expiration');
        expiredCount++;

        // Update progress
        const progress = 30 + Math.floor((i / listingIds.length) * 60);
        await job.updateProgress(progress);
      } catch (error) {
        const err = error as Error;
        errors.push({ listingId, error: err.message });
        this.logger.warn(`Failed to expire listing ${listingId}: ${err.message}`);
      }
    }

    await job.updateProgress(100);

    const result: ListingExpirationResult = {
      success: errors.length === 0,
      listingIds,
      expiredCount,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      processedAt: new Date().toISOString(),
    };

    return {
      success: result.success,
      message: `Expired ${expiredCount}/${listingIds.length} listings`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Expire a single listing.
   */
  private async handleExpireSingle(job: Job<ListingExpireSingleJob>): Promise<JobResult> {
    const { partnerId, listingId, reason } = job.data;

    this.logger.debug(`Expiring listing ${listingId} for partner ${partnerId}`);

    await job.updateProgress(10);

    try {
      await this.expireListing(partnerId, listingId, reason);
      await job.updateProgress(100);

      const result: ListingExpirationResult = {
        success: true,
        listingId,
        expiredCount: 1,
        processedAt: new Date().toISOString(),
      };

      return {
        success: true,
        message: `Listing ${listingId} expired successfully`,
        data: result as unknown as Record<string, unknown>,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to expire listing ${listingId}: ${err.message}`);
    }
  }

  /**
   * Expire multiple listings in batch.
   */
  private async handleExpireBatch(job: Job<ListingExpireBatchJob>): Promise<JobResult> {
    const { partnerId, listingIds, reason } = job.data;

    this.logger.log(`Expiring ${listingIds.length} listings for partner ${partnerId}`);

    await job.updateProgress(10);

    let expiredCount = 0;
    const errors: Array<{ listingId: string; error: string }> = [];

    for (let i = 0; i < listingIds.length; i++) {
      const listingId = listingIds[i];
      try {
        await this.expireListing(partnerId, listingId, reason);
        expiredCount++;

        const progress = 10 + Math.floor((i / listingIds.length) * 85);
        await job.updateProgress(progress);
      } catch (error) {
        const err = error as Error;
        errors.push({ listingId, error: err.message });
      }
    }

    await job.updateProgress(100);

    const result: ListingExpirationResult = {
      success: errors.length === 0,
      listingIds,
      expiredCount,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      processedAt: new Date().toISOString(),
    };

    return {
      success: result.success,
      message: `Expired ${expiredCount}/${listingIds.length} listings`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Renew an expired listing.
   */
  private async handleRenew(job: Job<ListingRenewJob>): Promise<JobResult> {
    const { partnerId, listingId, newExpiresAt } = job.data;

    this.logger.debug(`Renewing listing ${listingId} until ${newExpiresAt}`);

    await job.updateProgress(10);

    // Find listing
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        partnerId,
      },
    });

    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

    await job.updateProgress(30);

    // Update listing
    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.PUBLISHED,
        expiresAt: new Date(newExpiresAt),
        publishedAt: listing.status === ListingStatus.EXPIRED ? new Date() : listing.publishedAt,
      },
    });

    await job.updateProgress(80);

    // Emit renewal event
    this.eventEmitter.emit('listing.renewed', {
      partnerId,
      listingId,
      vendorId: listing.vendorId,
      previousStatus: listing.status,
      newExpiresAt,
    });

    await job.updateProgress(100);

    return {
      success: true,
      message: `Listing ${listingId} renewed until ${newExpiresAt}`,
      data: { listingId, newExpiresAt },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Expire a single listing (internal helper).
   */
  private async expireListing(partnerId: string, listingId: string, reason?: string): Promise<void> {
    // Find listing
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        partnerId,
        status: ListingStatus.PUBLISHED,
      },
    });

    if (!listing) {
      throw new Error(`Published listing ${listingId} not found`);
    }

    // Update status to EXPIRED
    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.EXPIRED,
      },
    });

    // Emit expiration event
    this.eventEmitter.emit('listing.expired', {
      partnerId,
      listingId,
      vendorId: listing.vendorId,
      title: listing.title,
      reason: reason || 'Expiration date reached',
      expiredAt: new Date().toISOString(),
    });

    this.logger.log(`Listing ${listingId} expired: ${reason || 'Expiration date reached'}`);
  }
}
