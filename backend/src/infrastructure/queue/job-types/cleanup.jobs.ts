import { BaseJobData } from '../queue.interfaces';

/**
 * Cleanup job types per part-31.md specification.
 */
export type CleanupJobType =
  | 'media.orphaned'
  | 'sessions.expired'
  | 'tokens.expired'
  | 'logs.archive'
  | 'soft_deletes.purge'
  | 'cache.clear';

/**
 * Clean up orphaned media files.
 */
export interface MediaOrphanedCleanupJob extends BaseJobData {
  type: 'media.orphaned';
  olderThan: string; // ISO date string
  batchSize: number;
  dryRun?: boolean;
}

/**
 * Clean up expired sessions.
 */
export interface SessionsExpiredCleanupJob extends BaseJobData {
  type: 'sessions.expired';
  olderThan: string;
  batchSize: number;
}

/**
 * Clean up expired tokens.
 */
export interface TokensExpiredCleanupJob extends BaseJobData {
  type: 'tokens.expired';
  tokenType?: 'refresh' | 'reset' | 'verification' | 'all';
  olderThan: string;
  batchSize: number;
}

/**
 * Archive old logs.
 */
export interface LogsArchiveJob extends BaseJobData {
  type: 'logs.archive';
  logType: 'audit' | 'error' | 'access' | 'all';
  olderThan: string;
  destinationBucket?: string;
  compress?: boolean;
}

/**
 * Purge soft-deleted records.
 */
export interface SoftDeletesPurgeJob extends BaseJobData {
  type: 'soft_deletes.purge';
  entityType?: 'listing' | 'media' | 'user' | 'vendor' | 'all';
  olderThan: string;
  batchSize: number;
}

/**
 * Clear cache entries.
 */
export interface CacheClearJob extends BaseJobData {
  type: 'cache.clear';
  pattern?: string;
  prefix?: string;
  all?: boolean;
}

/**
 * Union type for all cleanup jobs.
 */
export type CleanupJob =
  | MediaOrphanedCleanupJob
  | SessionsExpiredCleanupJob
  | TokensExpiredCleanupJob
  | LogsArchiveJob
  | SoftDeletesPurgeJob
  | CacheClearJob;

/**
 * Cleanup result.
 */
export interface CleanupResult {
  success: boolean;
  jobType: CleanupJobType;
  recordsProcessed: number;
  recordsDeleted: number;
  recordsArchived?: number;
  bytesFreed?: number;
  errors?: string[];
  processedAt: string;
  duration: number;
}
