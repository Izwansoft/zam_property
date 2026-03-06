import { BaseJobData } from '../queue.interfaces';

/**
 * Tenancy expiry job types.
 */
export type TenancyExpiryJobType =
  | 'tenancy.check_expiring'
  | 'tenancy.notify_expiring'
  | 'tenancy.auto_terminate';

/**
 * Check for expiring tenancies (scheduled job).
 * Finds tenancies approaching their lease end date.
 */
export interface TenancyCheckExpiringJob extends BaseJobData {
  type: 'tenancy.check_expiring';
  checkDate: string;
  daysBeforeExpiry: number; // How many days before to notify (e.g., 30, 14, 7)
  batchSize?: number;
}

/**
 * Send expiry notification to tenant and owner.
 */
export interface TenancyNotifyExpiringJob extends BaseJobData {
  type: 'tenancy.notify_expiring';
  tenancyId: string;
  daysUntilExpiry: number;
  notificationType: 'first_notice' | 'reminder' | 'final_notice';
}

/**
 * Auto-terminate tenancy past lease end date.
 */
export interface TenancyAutoTerminateJob extends BaseJobData {
  type: 'tenancy.auto_terminate';
  tenancyId: string;
  reason?: string;
}

/**
 * Union type for all tenancy expiry jobs.
 */
export type TenancyExpiryJob =
  | TenancyCheckExpiringJob
  | TenancyNotifyExpiringJob
  | TenancyAutoTerminateJob;

/**
 * Tenancy expiry processing result.
 */
export interface TenancyExpiryResult {
  success: boolean;
  tenancyId?: string;
  tenancyIds?: string[];
  notifiedCount?: number;
  terminatedCount?: number;
  failedCount?: number;
  errors?: Array<{
    tenancyId: string;
    error: string;
  }>;
  processedAt: string;
}
