import { BaseJobData } from '../queue.interfaces';

/**
 * Search indexing job types per part-31.md specification.
 */
export type SearchIndexJobType =
  | 'listing.index'
  | 'listing.delete'
  | 'vendor.index'
  | 'bulk.reindex';

/**
 * Base search index job payload.
 */
export interface SearchIndexJobBase extends BaseJobData {
  type: SearchIndexJobType;
  indexName: string;
}

/**
 * Single listing index job.
 */
export interface ListingIndexJob extends SearchIndexJobBase {
  type: 'listing.index';
  listingId: string;
  document?: Record<string, unknown>;
}

/**
 * Single listing delete job.
 */
export interface ListingDeleteJob extends SearchIndexJobBase {
  type: 'listing.delete';
  listingId: string;
}

/**
 * Vendor index job.
 */
export interface VendorIndexJob extends SearchIndexJobBase {
  type: 'vendor.index';
  vendorId: string;
  document?: Record<string, unknown>;
}

/**
 * Bulk reindex job.
 */
export interface BulkReindexJob extends SearchIndexJobBase {
  type: 'bulk.reindex';
  entityType: 'listing' | 'vendor';
  filters?: {
    status?: string[];
    verticalType?: string;
    createdAfter?: string;
    createdBefore?: string;
  };
  batchSize: number;
  offset?: number;
  totalCount?: number;
}

/**
 * Union type for all search index jobs.
 */
export type SearchIndexJob = ListingIndexJob | ListingDeleteJob | VendorIndexJob | BulkReindexJob;
