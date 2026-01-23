import { BaseJobData } from '../queue.interfaces';

/**
 * Listing expiration job types.
 */
export type ListingExpireJobType =
  | 'listing.check_expired'
  | 'listing.expire_single'
  | 'listing.expire_batch'
  | 'listing.renew';

/**
 * Check for expired listings (scheduled job).
 */
export interface ListingCheckExpiredJob extends BaseJobData {
  type: 'listing.check_expired';
  checkDate: string;
  batchSize?: number;
}

/**
 * Expire a single listing.
 */
export interface ListingExpireSingleJob extends BaseJobData {
  type: 'listing.expire_single';
  listingId: string;
  reason?: string;
}

/**
 * Expire multiple listings in batch.
 */
export interface ListingExpireBatchJob extends BaseJobData {
  type: 'listing.expire_batch';
  listingIds: string[];
  reason?: string;
}

/**
 * Renew an expired listing.
 */
export interface ListingRenewJob extends BaseJobData {
  type: 'listing.renew';
  listingId: string;
  newExpiresAt: string;
}

/**
 * Union type for all listing expire jobs.
 */
export type ListingExpireJob =
  | ListingCheckExpiredJob
  | ListingExpireSingleJob
  | ListingExpireBatchJob
  | ListingRenewJob;

/**
 * Listing expiration result.
 */
export interface ListingExpirationResult {
  success: boolean;
  listingId?: string;
  listingIds?: string[];
  expiredCount?: number;
  failedCount?: number;
  errors?: Array<{
    listingId: string;
    error: string;
  }>;
  processedAt: string;
}
