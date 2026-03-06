import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@infrastructure/database';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.constants';

/**
 * Scheduler service for managing scheduled/cron jobs.
 *
 * Per part-31.md scheduled jobs:
 * - Subscription Renewal Check: Daily at midnight
 * - Usage Aggregation: Hourly
 * - Orphaned Media Cleanup: Daily at 3 AM
 * - Expired Sessions Cleanup: Every 15 minutes
 * - Search Index Health Check: Every 4 hours
 * - Metrics Roll-up: Daily at midnight
 * - Soft Delete Purge: Weekly on Sunday at 4 AM
 * - Listing Expiration Check: Every hour
 *
 * Rent billing scheduled jobs:
 * - Monthly Bill Generation: Daily at 6 AM (checks each partner's billing day)
 * - Overdue Detection: Daily at 9 AM
 * - Late Fee Application: Daily at 10 AM (after overdue detection)
 * - Payment Reminders: Daily at 7 AM
 * - Monthly Payout Run: 15th of each month at 8 AM
 */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Scheduler service initialized');
  }

  /**
   * Check for expired listings - runs every hour.
   * Finds all PUBLISHED listings past their expiresAt date.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleListingExpirationCheck(): Promise<void> {
    this.logger.log('Scheduling listing expiration check');

    try {
      // Get all tenants
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const partner of tenants) {
        await this.queueService.addJob('listing.expire', 'listing.check_expired', {
          partnerId: partner.id,
          type: 'listing.check_expired',
          checkDate: new Date().toISOString(),
          batchSize: 100,
        });
      }

      this.logger.log(`Scheduled expiration check for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule listing expiration check: ${(error as Error).message}`);
    }
  }

  /**
   * Check for expiring tenancies - runs daily at 8 AM.
   * Queues notification jobs for tenancies approaching lease end.
   * Checks for 30 days, 14 days, and 7 days before expiry.
   */
  @Cron('0 8 * * *')
  async scheduleTenancyExpiryCheck(): Promise<void> {
    this.logger.log('Scheduling tenancy expiry check');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Check for tenancies expiring in 30, 14, and 7 days
      const expiryWindows = [30, 14, 7];

      for (const partner of tenants) {
        for (const days of expiryWindows) {
          await this.queueService.addJob('tenancy.expiry', 'tenancy.check_expiring', {
            partnerId: partner.id,
            type: 'tenancy.check_expiring',
            daysBeforeExpiry: days,
            batchSize: 100,
          });
        }
      }

      this.logger.log(`Scheduled tenancy expiry check for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule tenancy expiry check: ${(error as Error).message}`);
    }
  }

  /**
   * Auto-terminate expired tenancies - runs daily at midnight.
   * Terminates tenancies past their lease end date.
   */
  @Cron('0 0 * * *')
  async scheduleTenancyAutoTerminate(): Promise<void> {
    this.logger.log('Scheduling tenancy auto-terminate');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const partner of tenants) {
        // Find active tenancies past lease end date
        const expiredTenancies = await this.prisma.tenancy.findMany({
          where: {
            partnerId: partner.id,
            status: 'ACTIVE',
            leaseEndDate: {
              lt: new Date(),
            },
          },
          select: { id: true },
          take: 100,
        });

        for (const tenancy of expiredTenancies) {
          await this.queueService.addJob('tenancy.expiry', 'tenancy.auto_terminate', {
            partnerId: partner.id,
            type: 'tenancy.auto_terminate',
            tenancyId: tenancy.id,
            reason: 'Lease term completed - auto-terminated',
          });
        }

        if (expiredTenancies.length > 0) {
          this.logger.log(
            `Scheduled ${expiredTenancies.length} tenancy auto-terminates for partner ${partner.id}`,
          );
        }
      }

      this.logger.log(`Scheduled tenancy auto-terminate for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule tenancy auto-terminate: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up orphaned media - runs daily at 3 AM.
   */
  @Cron('0 3 * * *')
  async scheduleOrphanedMediaCleanup(): Promise<void> {
    this.logger.log('Scheduling orphaned media cleanup');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Cleanup media older than 24 hours that are still in PENDING state
      const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      for (const partner of tenants) {
        await this.queueService.addJob(QUEUE_NAMES.CLEANUP_PROCESS, 'media.orphaned', {
          partnerId: partner.id,
          type: 'media.orphaned',
          olderThan,
          batchSize: 100,
          dryRun: false,
        });
      }

      this.logger.log(`Scheduled orphaned media cleanup for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule media cleanup: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up expired sessions - runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async scheduleExpiredSessionsCleanup(): Promise<void> {
    this.logger.log('Scheduling expired sessions cleanup');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const olderThan = new Date().toISOString();

      for (const partner of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.CLEANUP_PROCESS, 'sessions.expired', {
          partnerId: partner.id,
          type: 'sessions.expired',
          olderThan,
          batchSize: 500,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to schedule sessions cleanup: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up expired tokens - runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async scheduleExpiredTokensCleanup(): Promise<void> {
    this.logger.log('Scheduling expired tokens cleanup');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const olderThan = new Date().toISOString();

      for (const partner of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.CLEANUP_PROCESS, 'tokens.expired', {
          partnerId: partner.id,
          type: 'tokens.expired',
          tokenType: 'all',
          olderThan,
          batchSize: 500,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to schedule tokens cleanup: ${(error as Error).message}`);
    }
  }

  /**
   * Aggregate hourly usage metrics - runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleHourlyUsageAggregation(): Promise<void> {
    this.logger.log('Scheduling hourly usage aggregation');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      for (const partner of tenants) {
        await this.queueService.addLowPriorityJob(
          QUEUE_NAMES.ANALYTICS_PROCESS,
          'metrics.aggregate',
          {
            partnerId: partner.id,
            type: 'metrics.aggregate',
            aggregationType: 'hourly',
            dateRange: {
              start: hourAgo.toISOString(),
              end: now.toISOString(),
            },
            metrics: ['listing.view', 'listing.impression', 'listing.contact', 'search.query'],
          },
        );
      }

      this.logger.log(`Scheduled hourly usage aggregation for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule usage aggregation: ${(error as Error).message}`);
    }
  }

  /**
   * Daily metrics roll-up - runs at midnight.
   */
  @Cron('0 0 * * *')
  async scheduleDailyMetricsRollup(): Promise<void> {
    this.logger.log('Scheduling daily metrics roll-up');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().slice(0, 10);

      for (const partner of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.ANALYTICS_PROCESS, 'metrics.rollup', {
          partnerId: partner.id,
          type: 'metrics.rollup',
          sourceGranularity: 'hourly',
          targetGranularity: 'daily',
          date: dateStr,
          metrics: [
            'listing.view',
            'listing.impression',
            'listing.contact',
            'search.query',
            'user.signup',
            'user.login',
          ],
        });
      }

      this.logger.log(`Scheduled daily metrics roll-up for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule metrics roll-up: ${(error as Error).message}`);
    }
  }

  /**
   * Weekly soft-delete purge - runs on Sunday at 4 AM.
   */
  @Cron('0 4 * * 0')
  async scheduleWeeklySoftDeletePurge(): Promise<void> {
    this.logger.log('Scheduling weekly soft-delete purge');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Purge records soft-deleted more than 30 days ago
      const olderThan = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      for (const partner of tenants) {
        await this.queueService.addLowPriorityJob(
          QUEUE_NAMES.CLEANUP_PROCESS,
          'soft_deletes.purge',
          {
            partnerId: partner.id,
            type: 'soft_deletes.purge',
            entityType: 'all',
            olderThan,
            batchSize: 100,
          },
        );
      }

      this.logger.log(`Scheduled soft-delete purge for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule soft-delete purge: ${(error as Error).message}`);
    }
  }

  /**
   * Search index health check - runs every 4 hours.
   */
  @Cron('0 */4 * * *')
  async scheduleSearchIndexHealthCheck(): Promise<void> {
    this.logger.log('Scheduling search index health check');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const partner of tenants) {
        // Queue a bulk reindex check (not full reindex)
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.SEARCH_INDEX, 'bulk.reindex', {
          partnerId: partner.id,
          type: 'bulk.reindex',
          indexName: `listings_${partner.id}`,
          entityType: 'listing',
          batchSize: 10, // Just check a small sample
        });
      }

      this.logger.log(`Scheduled search index health check for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(
        `Failed to schedule search index health check: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Archive old audit logs - runs monthly on the 1st at 2 AM.
   */
  @Cron('0 2 1 * *')
  async scheduleMonthlyLogArchive(): Promise<void> {
    this.logger.log('Scheduling monthly log archive');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Archive logs older than 90 days
      const olderThan = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      for (const partner of tenants) {
        await this.queueService.addLowPriorityJob(QUEUE_NAMES.CLEANUP_PROCESS, 'logs.archive', {
          partnerId: partner.id,
          type: 'logs.archive',
          logType: 'audit',
          olderThan,
          compress: true,
        });
      }

      this.logger.log(`Scheduled log archive for ${tenants.length} tenants`);
    } catch (error) {
      this.logger.error(`Failed to schedule log archive: ${(error as Error).message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rent Billing Scheduled Jobs
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Monthly bill generation — runs daily at 6 AM.
   *
   * Each tenancy has a configurable `billingDay` (1-28).
   * This cron runs every day and checks if today matches any tenancy's billing day.
   * For each matching partner, a batch generation job is queued.
   *
   * Example: If billingDay = 1, bills are generated on the 1st of each month.
   */
  @Cron('0 6 * * *')
  async scheduleMonthlyBillGeneration(): Promise<void> {
    this.logger.log('Scheduling monthly bill generation check');

    try {
      const today = new Date();
      const currentDay = today.getUTCDate();

      // Calculate billing period (1st of current month)
      const billingPeriod = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      ).toISOString();

      // Get active tenants that have tenancies with today's billing day
      const tenants = await this.prisma.partner.findMany({
        where: {
          status: 'ACTIVE',
          tenancies: {
            some: {
              billingDay: currentDay,
              status: {
                in: ['ACTIVE', 'MAINTENANCE_HOLD', 'INSPECTION_PENDING', 'TERMINATION_REQUESTED'],
              },
            },
          },
        },
        select: { id: true },
      });

      if (tenants.length === 0) {
        this.logger.log(`No tenants with billing day ${currentDay} found`);
        return;
      }

      for (const partner of tenants) {
        await this.queueService.addJob(
          QUEUE_NAMES.BILLING_PROCESS,
          'rent-billing.generate-batch',
          {
            partnerId: partner.id,
            type: 'rent-billing.generate-batch' as const,
            billingPeriod,
            billingDay: currentDay,
            batchSize: 100,
          },
        );
      }

      this.logger.log(
        `Scheduled bill generation for ${tenants.length} tenants (billing day: ${currentDay})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule monthly bill generation: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Overdue bill detection — runs daily at 9 AM.
   *
   * Finds all bills past their due date that are still in
   * GENERATED / SENT / PARTIALLY_PAID status, and marks them OVERDUE.
   */
  @Cron('0 9 * * *')
  async scheduleOverdueDetection(): Promise<void> {
    this.logger.log('Scheduling overdue bill detection');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const partner of tenants) {
        await this.queueService.addJob(
          QUEUE_NAMES.BILLING_PROCESS,
          'rent-billing.detect-overdue',
          {
            partnerId: partner.id,
            type: 'rent-billing.detect-overdue' as const,
            batchSize: 200,
          },
        );
      }

      this.logger.log(
        `Scheduled overdue detection for ${tenants.length} tenants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule overdue detection: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Late fee application — runs daily at 10 AM (after overdue detection).
   *
   * For tenancies with a configured lateFeePercent, calculates
   * and adds late fee line items to overdue bills.
   */
  @Cron('0 10 * * *')
  async scheduleLateFeeApplication(): Promise<void> {
    this.logger.log('Scheduling late fee application');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const partner of tenants) {
        await this.queueService.addJob(
          QUEUE_NAMES.BILLING_PROCESS,
          'rent-billing.apply-late-fees',
          {
            partnerId: partner.id,
            type: 'rent-billing.apply-late-fees' as const,
            batchSize: 100,
          },
        );
      }

      this.logger.log(
        `Scheduled late fee application for ${tenants.length} tenants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule late fee application: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Payment reminder processing — runs daily at 7 AM.
   *
   * Scans all unpaid billings and sends reminders based on schedule:
   * - Sequence 1: 3 days before due date
   * - Sequence 2: On due date
   * - Sequence 3: 7 days after due date
   * - Sequence 4: 14 days after due date (legal notice / escalation)
   *
   * After the 3rd reminder, the 4th triggers a legal escalation flag.
   */
  @Cron('0 7 * * *')
  async schedulePaymentReminders(): Promise<void> {
    this.logger.log('Scheduling payment reminder processing');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const partner of tenants) {
        await this.queueService.addJob(
          QUEUE_NAMES.BILLING_PROCESS,
          'rent-billing.process-reminders',
          {
            partnerId: partner.id,
            type: 'rent-billing.process-reminders' as const,
          },
        );
      }

      this.logger.log(
        `Scheduled payment reminder processing for ${tenants.length} tenants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule payment reminders: ${(error as Error).message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Owner Payout Scheduled Jobs
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Monthly payout run — runs on the 15th of each month at 8 AM.
   *
   * For each active partner, enqueues a payout calculation job
   * for all owners with completed payments in the previous month.
   */
  @Cron('0 8 15 * *')
  async scheduleMonthlyPayoutRun(): Promise<void> {
    this.logger.log('Scheduling monthly payout run');

    try {
      const tenants = await this.prisma.partner.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      if (tenants.length === 0) {
        this.logger.log('No active tenants for payout run');
        return;
      }

      // Calculate previous month period
      const now = new Date();
      const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));

      for (const partner of tenants) {
        await this.queueService.addJob(
          QUEUE_NAMES.BILLING_PROCESS,
          'payout.monthly-run',
          {
            partnerId: partner.id,
            type: 'payout.monthly-run' as const,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          },
        );
      }

      this.logger.log(
        `Scheduled monthly payout run for ${tenants.length} tenants ` +
        `(period: ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule monthly payout run: ${(error as Error).message}`,
      );
    }
  }
}
