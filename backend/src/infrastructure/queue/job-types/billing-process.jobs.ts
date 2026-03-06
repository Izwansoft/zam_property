import { BaseJobData } from '../queue.interfaces';

/**
 * Rent billing job types for automated billing operations.
 */
export type RentBillingJobType =
  | 'rent-billing.generate-batch'
  | 'rent-billing.generate-single'
  | 'rent-billing.detect-overdue'
  | 'rent-billing.apply-late-fees'
  | 'rent-billing.process-reminders'
  | 'payout.monthly-run';

/**
 * Batch bill generation job — queued by the scheduler.
 * Finds all ACTIVE tenancies for a partner and generates bills.
 */
export interface RentBillingGenerateBatchJob extends BaseJobData {
  type: 'rent-billing.generate-batch';
  billingPeriod: string; // YYYY-MM-DD
  billingDay: number; // Day of month that triggered this batch
  batchSize?: number;
}

/**
 * Single tenancy bill generation — queued by batch processor.
 */
export interface RentBillingGenerateSingleJob extends BaseJobData {
  type: 'rent-billing.generate-single';
  tenancyId: string;
  billingPeriod: string; // YYYY-MM-DD
  includeLateFee: boolean;
}

/**
 * Detect overdue bills — finds all bills past due date
 * and transitions them to OVERDUE status.
 */
export interface RentBillingDetectOverdueJob extends BaseJobData {
  type: 'rent-billing.detect-overdue';
  batchSize?: number;
}

/**
 * Apply late fees to overdue bills — runs after overdue detection.
 */
export interface RentBillingApplyLateFeesJob extends BaseJobData {
  type: 'rent-billing.apply-late-fees';
  batchSize?: number;
}

/**
 * Process payment reminders — scans unpaid billings and sends
 * reminders based on schedule relative to due date.
 */
export interface RentBillingProcessRemindersJob extends BaseJobData {
  type: 'rent-billing.process-reminders';
}

/**
 * Monthly payout calculation — iterates all owners in a partner
 * and calculates payouts for the previous month.
 */
export interface PayoutMonthlyRunJob extends BaseJobData {
  type: 'payout.monthly-run';
  periodStart: string; // ISO date
  periodEnd: string;   // ISO date
}

/**
 * Union type for all rent billing jobs.
 */
export type RentBillingJob =
  | RentBillingGenerateBatchJob
  | RentBillingGenerateSingleJob
  | RentBillingDetectOverdueJob
  | RentBillingApplyLateFeesJob
  | RentBillingProcessRemindersJob
  | PayoutMonthlyRunJob;

/**
 * Rent billing processing result.
 */
export interface RentBillingJobResult {
  success: boolean;
  generatedCount?: number;
  skippedCount?: number;
  failedCount?: number;
  overdueCount?: number;
  lateFeesApplied?: number;
  remindersProcessed?: number;
  remindersSent?: number;
  remindersEscalated?: number;
  errors?: Array<{
    tenancyId?: string;
    billingId?: string;
    error: string;
  }>;
  processedAt: string;
}
