import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IndexingService } from '../services/indexing.service';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import {
  SearchIndexJob,
  ListingIndexJob,
  ListingDeleteJob,
  VendorIndexJob,
  BulkReindexJob,
} from '../../queue/job-types';
import { JobResult } from '../../queue/queue.interfaces';

/**
 * Search index processor for handling search-related background jobs.
 *
 * Per part-31.md:
 * - listing.index: Index a single listing (priority: high, timeout: 10s)
 * - listing.delete: Delete a listing from index (priority: high, timeout: 5s)
 * - vendor.index: Index a vendor (priority: normal, timeout: 10s)
 * - bulk.reindex: Reindex multiple documents (priority: low, timeout: 300s)
 */
@Processor(QUEUE_NAMES.SEARCH_INDEX)
export class SearchIndexProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchIndexProcessor.name);

  constructor(private readonly indexingService: IndexingService) {
    super();
  }

  async process(job: Job<SearchIndexJob>): Promise<JobResult> {
    const startTime = Date.now();
    const { name, data } = job;

    this.logger.log({
      event: 'job.started',
      queue: QUEUE_NAMES.SEARCH_INDEX,
      jobId: job.id,
      jobType: name,
      tenantId: data.tenantId,
    });

    try {
      let result: JobResult;

      switch (data.type) {
        case 'listing.index':
          result = await this.handleListingIndex(job as Job<ListingIndexJob>);
          break;
        case 'listing.delete':
          result = await this.handleListingDelete(job as Job<ListingDeleteJob>);
          break;
        case 'vendor.index':
          result = await this.handleVendorIndex(job as Job<VendorIndexJob>);
          break;
        case 'bulk.reindex':
          result = await this.handleBulkReindex(job as Job<BulkReindexJob>);
          break;
        default:
          this.logger.warn(`Unknown job type: ${(data as SearchIndexJob).type}`);
          result = {
            success: false,
            message: `Unknown job type: ${(data as SearchIndexJob).type}`,
            processedAt: new Date().toISOString(),
          };
      }

      this.logger.log({
        event: 'job.completed',
        queue: QUEUE_NAMES.SEARCH_INDEX,
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
        queue: QUEUE_NAMES.SEARCH_INDEX,
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        error: err.message,
        stack: err.stack,
      });
      throw error; // Let BullMQ handle retries
    }
  }

  /**
   * Handle single listing indexing.
   */
  private async handleListingIndex(job: Job<ListingIndexJob>): Promise<JobResult> {
    const { tenantId, listingId } = job.data;

    this.logger.debug(`Indexing listing ${listingId} for tenant ${tenantId}`);

    await job.updateProgress(10);
    await this.indexingService.indexListing(tenantId, listingId);
    await job.updateProgress(100);

    return {
      success: true,
      message: `Listing ${listingId} indexed successfully`,
      data: { listingId, tenantId },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle single listing deletion from index.
   */
  private async handleListingDelete(job: Job<ListingDeleteJob>): Promise<JobResult> {
    const { tenantId, listingId } = job.data;

    this.logger.debug(`Deleting listing ${listingId} from index for tenant ${tenantId}`);

    await job.updateProgress(10);
    await this.indexingService.deleteListing(tenantId, listingId);
    await job.updateProgress(100);

    return {
      success: true,
      message: `Listing ${listingId} deleted from index`,
      data: { listingId, tenantId },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle vendor indexing.
   * Note: Currently vendor indexing is not implemented in IndexingService.
   * This is a placeholder for future implementation.
   */
  private async handleVendorIndex(job: Job<VendorIndexJob>): Promise<JobResult> {
    const { tenantId, vendorId } = job.data;

    this.logger.debug(`Indexing vendor ${vendorId} for tenant ${tenantId}`);

    await job.updateProgress(10);
    // TODO: Implement vendor indexing when vendor search is needed
    // await this.indexingService.indexVendor(tenantId, vendorId);
    await job.updateProgress(100);

    return {
      success: true,
      message: `Vendor ${vendorId} indexing placeholder - not yet implemented`,
      data: { vendorId, tenantId },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle bulk reindexing.
   * Processes listings in batches with progress updates.
   */
  private async handleBulkReindex(job: Job<BulkReindexJob>): Promise<JobResult> {
    const { tenantId, entityType, filters, batchSize = 100 } = job.data;

    this.logger.log(`Starting bulk reindex for tenant ${tenantId}, entity: ${entityType}`);

    await job.updateProgress(5);

    if (entityType === 'listing') {
      const result = await this.indexingService.reindexTenant(tenantId, filters?.verticalType);

      await job.updateProgress(100);

      return {
        success: true,
        message: `Bulk reindex completed: ${result.indexed} listings indexed`,
        data: {
          tenantId,
          entityType,
          indexed: result.indexed,
          batchSize,
        },
        processedAt: new Date().toISOString(),
      };
    }

    // Vendor reindex placeholder
    return {
      success: true,
      message: `Bulk reindex for ${entityType} not yet implemented`,
      data: { tenantId, entityType },
      processedAt: new Date().toISOString(),
    };
  }
}
