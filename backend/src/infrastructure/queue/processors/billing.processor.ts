import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenancyStatus, RentBillingStatus, PayoutStatus, RentPaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@infrastructure/database';
import {
  RentBillingJob,
  RentBillingGenerateBatchJob,
  RentBillingGenerateSingleJob,
  RentBillingDetectOverdueJob,
  RentBillingApplyLateFeesJob,
  RentBillingProcessRemindersJob,
  PayoutMonthlyRunJob,
} from '../job-types';
import { JobResult } from '../queue.interfaces';
import { QUEUE_NAMES } from '../queue.constants';
import { QueueService } from '../queue.service';

// ─────────────────────────────────────────────────────────────────────────────
// Domain Events
// ─────────────────────────────────────────────────────────────────────────────

export class BillingBatchCompletedEvent {
  constructor(
    public readonly partnerId: string,
    public readonly billingPeriod: string,
    public readonly generatedCount: number,
    public readonly skippedCount: number,
    public readonly failedCount: number,
  ) {}
}

export class BillingOverdueDetectedEvent {
  constructor(
    public readonly partnerId: string,
    public readonly overdueCount: number,
    public readonly billingIds: string[],
  ) {}
}

/**
 * Billing processor for handling automated rent billing jobs.
 *
 * Job types:
 * - rent-billing.generate-batch: Find all ACTIVE tenancies and queue individual bill generation
 * - rent-billing.generate-single: Generate a bill for one tenancy
 * - rent-billing.detect-overdue: Find bills past due date and mark as OVERDUE
 * - rent-billing.apply-late-fees: Calculate and apply late fees to overdue tenancies
 */
@Processor(QUEUE_NAMES.BILLING_PROCESS)
@Injectable()
export class BillingProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingProcessor.name);

  /** Tenancy statuses that are eligible for billing */
  private readonly BILLABLE_STATUSES: TenancyStatus[] = [
    TenancyStatus.ACTIVE,
    TenancyStatus.MAINTENANCE_HOLD,
    TenancyStatus.INSPECTION_PENDING,
    TenancyStatus.TERMINATION_REQUESTED,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<RentBillingJob>): Promise<JobResult> {
    const startTime = Date.now();
    const { data } = job;

    this.logger.log({
      event: 'job.started',
      queue: QUEUE_NAMES.BILLING_PROCESS,
      jobId: job.id,
      jobType: data.type,
      partnerId: data.partnerId,
    });

    try {
      let result: JobResult;

      switch (data.type) {
        case 'rent-billing.generate-batch':
          result = await this.handleGenerateBatch(job as Job<RentBillingGenerateBatchJob>);
          break;
        case 'rent-billing.generate-single':
          result = await this.handleGenerateSingle(job as Job<RentBillingGenerateSingleJob>);
          break;
        case 'rent-billing.detect-overdue':
          result = await this.handleDetectOverdue(job as Job<RentBillingDetectOverdueJob>);
          break;
        case 'rent-billing.apply-late-fees':
          result = await this.handleApplyLateFees(job as Job<RentBillingApplyLateFeesJob>);
          break;
        case 'rent-billing.process-reminders':
          result = await this.handleProcessReminders(job as Job<RentBillingProcessRemindersJob>);
          break;
        case 'payout.monthly-run':
          result = await this.handlePayoutMonthlyRun(job as Job<PayoutMonthlyRunJob>);
          break;
        default:
          this.logger.warn(`Unknown job type: ${(data as RentBillingJob).type}`);
          result = {
            success: false,
            message: `Unknown job type: ${(data as RentBillingJob).type}`,
            processedAt: new Date().toISOString(),
          };
      }

      this.logger.log({
        event: 'job.completed',
        queue: QUEUE_NAMES.BILLING_PROCESS,
        jobId: job.id,
        jobType: data.type,
        duration: Date.now() - startTime,
        success: result.success,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        event: 'job.failed',
        queue: QUEUE_NAMES.BILLING_PROCESS,
        jobId: job.id,
        jobType: data.type,
        duration: Date.now() - startTime,
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Batch Bill Generation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Find all ACTIVE tenancies for a partner where billingDay matches today,
   * and queue individual bill generation jobs.
   */
  private async handleGenerateBatch(
    job: Job<RentBillingGenerateBatchJob>,
  ): Promise<JobResult> {
    const { partnerId, billingPeriod, billingDay, batchSize = 100 } = job.data;

    // Find tenancies eligible for billing on this billing day
    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        partnerId,
        status: { in: this.BILLABLE_STATUSES },
        billingDay,
        // Only tenancies with an active lease covering the billing period
        leaseStartDate: { lte: new Date(billingPeriod) },
        OR: [
          { leaseEndDate: null },
          { leaseEndDate: { gte: new Date(billingPeriod) } },
        ],
      },
      select: {
        id: true,
        billingDay: true,
        lateFeePercent: true,
      },
      take: batchSize,
    });

    if (tenancies.length === 0) {
      this.logger.log(
        `No tenancies found for billing day ${billingDay} in partner ${partnerId}`,
      );
      return {
        success: true,
        message: 'No tenancies eligible for billing',
        data: { generatedCount: 0, skippedCount: 0, failedCount: 0 },
        processedAt: new Date().toISOString(),
      };
    }

    // Queue individual bill generation for each tenancy
    let queuedCount = 0;
    for (const tenancy of tenancies) {
      // Check if bill already exists for this period (skip if so)
      const existingBill = await this.prisma.rentBilling.findFirst({
        where: {
          tenancyId: tenancy.id,
          billingPeriod: new Date(billingPeriod),
        },
        select: { id: true },
      });

      if (existingBill) {
        this.logger.debug(
          `Skipping tenancy ${tenancy.id} — bill already exists for ${billingPeriod}`,
        );
        continue;
      }

      await this.queueService.addJob(
        QUEUE_NAMES.BILLING_PROCESS,
        'rent-billing.generate-single',
        {
          partnerId,
          type: 'rent-billing.generate-single' as const,
          tenancyId: tenancy.id,
          billingPeriod,
          includeLateFee: tenancy.lateFeePercent !== null && Number(tenancy.lateFeePercent) > 0,
        },
      );
      queuedCount++;
    }

    this.logger.log(
      `Queued ${queuedCount} individual bill generation jobs for partner ${partnerId}, billing day ${billingDay}`,
    );

    return {
      success: true,
      message: `Queued ${queuedCount} of ${tenancies.length} tenancies for bill generation`,
      data: {
        totalTenancies: tenancies.length,
        queuedCount,
        skippedCount: tenancies.length - queuedCount,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Single Bill Generation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a bill for a single tenancy.
   * Uses the RentBillingService logic inline to avoid circular deps.
   */
  private async handleGenerateSingle(
    job: Job<RentBillingGenerateSingleJob>,
  ): Promise<JobResult> {
    const { partnerId, tenancyId, billingPeriod, includeLateFee } = job.data;

    // Fetch tenancy with relations
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: tenancyId,
        partnerId,
        status: { in: this.BILLABLE_STATUSES },
      },
      include: {
        listing: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true, email: true } },
        tenant: {
          select: {
            id: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!tenancy) {
      return {
        success: false,
        message: `Tenancy ${tenancyId} not found or not in billable status`,
        processedAt: new Date().toISOString(),
      };
    }

    // Check for duplicate
    const billingPeriodDate = new Date(billingPeriod);
    billingPeriodDate.setUTCHours(0, 0, 0, 0);

    const existingBill = await this.prisma.rentBilling.findFirst({
      where: { tenancyId, billingPeriod: billingPeriodDate },
      select: { id: true, billNumber: true },
    });

    if (existingBill) {
      return {
        success: true,
        message: `Bill already exists: ${existingBill.billNumber}`,
        data: { skipped: true, billingId: existingBill.id },
        processedAt: new Date().toISOString(),
      };
    }

    // Generate bill number
    const billNumber = await this.generateBillNumber(partnerId);

    // Calculate amounts
    const rentAmount = Number(tenancy.monthlyRent);
    let lateFee = 0;

    if (includeLateFee && tenancy.lateFeePercent) {
      lateFee = await this.calculateLateFee(tenancyId, Number(tenancy.lateFeePercent));
    }

    const totalAmount = rentAmount + lateFee;
    const issueDate = new Date();
    const dueDate = new Date(billingPeriodDate);
    dueDate.setUTCDate(tenancy.billingDay + tenancy.paymentDueDay);

    // Build line items
    const lineItems: { description: string; type: string; amount: number }[] = [
      {
        description: `Monthly rent for ${billingPeriodDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}`,
        type: 'RENT',
        amount: rentAmount,
      },
    ];

    if (lateFee > 0) {
      lineItems.push({
        description: 'Late fee from overdue balance',
        type: 'LATE_FEE',
        amount: lateFee,
      });
    }

    const adjustments = lineItems
      .filter((li) => li.type !== 'RENT' && li.type !== 'LATE_FEE')
      .reduce((sum, li) => sum + li.amount, 0);

    // Create bill in transaction
    const billing = await this.prisma.$transaction(async (tx) => {
      const bill = await tx.rentBilling.create({
        data: {
          tenancyId,
          billNumber,
          billingPeriod: billingPeriodDate,
          status: RentBillingStatus.GENERATED,
          rentAmount,
          lateFee,
          adjustments,
          totalAmount,
          paidAmount: 0,
          balanceDue: totalAmount,
          issueDate,
          dueDate,
          lineItems: {
            create: lineItems.map((li) => ({
              description: li.description,
              type: li.type,
              amount: li.amount,
            })),
          },
        },
        include: { lineItems: true },
      });

      return bill;
    });

    this.logger.log(
      `Generated bill ${billNumber} for tenancy ${tenancyId}, period ${billingPeriod}, total: RM${totalAmount.toFixed(2)}`,
    );

    // Emit billing.generated event
    this.eventEmitter.emit('billing.generated', {
      billingId: billing.id,
      tenancyId,
      partnerId,
      billNumber,
      totalAmount,
      tenantUserId: tenancy.tenant.user.id,
      tenantEmail: tenancy.tenant.user.email,
      tenantName: tenancy.tenant.user.fullName,
      ownerName: tenancy.owner.name,
      propertyTitle: tenancy.listing.title,
      dueDate: dueDate.toISOString(),
    });

    return {
      success: true,
      message: `Bill ${billNumber} generated successfully`,
      data: {
        billingId: billing.id,
        billNumber,
        totalAmount,
        tenancyId,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Overdue Detection
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Find all bills past their due date and mark them as OVERDUE.
   */
  private async handleDetectOverdue(
    job: Job<RentBillingDetectOverdueJob>,
  ): Promise<JobResult> {
    const { partnerId, batchSize = 200 } = job.data;

    const now = new Date();

    // Find bills that are past due date and still in GENERATED/SENT/PARTIALLY_PAID status
    const overdueBills = await this.prisma.rentBilling.findMany({
      where: {
        tenancy: { partnerId },
        status: {
          in: [
            RentBillingStatus.GENERATED,
            RentBillingStatus.SENT,
            RentBillingStatus.PARTIALLY_PAID,
          ],
        },
        dueDate: { lt: now },
        balanceDue: { gt: 0 },
      },
      select: {
        id: true,
        billNumber: true,
        tenancyId: true,
        balanceDue: true,
        dueDate: true,
      },
      take: batchSize,
    });

    if (overdueBills.length === 0) {
      return {
        success: true,
        message: 'No overdue bills detected',
        data: { overdueCount: 0 },
        processedAt: new Date().toISOString(),
      };
    }

    // Batch update all to OVERDUE
    const billingIds = overdueBills.map((b) => b.id);
    await this.prisma.rentBilling.updateMany({
      where: { id: { in: billingIds } },
      data: { status: RentBillingStatus.OVERDUE },
    });

    // Emit events for each overdue bill
    for (const bill of overdueBills) {
      this.eventEmitter.emit('billing.overdue', {
        billingId: bill.id,
        tenancyId: bill.tenancyId,
        partnerId,
        billNumber: bill.billNumber,
        balanceDue: Number(bill.balanceDue),
        dueDate: bill.dueDate,
      });
    }

    this.logger.log(
      `Marked ${overdueBills.length} bills as OVERDUE for partner ${partnerId}`,
    );

    // Emit batch event
    this.eventEmitter.emit(
      'billing.overdue.batch',
      new BillingOverdueDetectedEvent(partnerId, overdueBills.length, billingIds),
    );

    return {
      success: true,
      message: `Marked ${overdueBills.length} bills as overdue`,
      data: {
        overdueCount: overdueBills.length,
        billingIds,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Late Fee Application
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Apply late fees to overdue tenancies.
   * For each tenancy with overdue bills, adds a LATE_FEE line item
   * to the most recent generated/overdue bill.
   */
  private async handleApplyLateFees(
    job: Job<RentBillingApplyLateFeesJob>,
  ): Promise<JobResult> {
    const { partnerId, batchSize = 100 } = job.data;

    // Find tenancies with overdue bills and a configured late fee
    const tenanciesWithOverdue = await this.prisma.tenancy.findMany({
      where: {
        partnerId,
        status: { in: this.BILLABLE_STATUSES },
        lateFeePercent: { not: null, gt: 0 },
        billings: {
          some: {
            status: RentBillingStatus.OVERDUE,
            balanceDue: { gt: 0 },
          },
        },
      },
      select: {
        id: true,
        lateFeePercent: true,
      },
      take: batchSize,
    });

    if (tenanciesWithOverdue.length === 0) {
      return {
        success: true,
        message: 'No tenancies with overdue bills for late fee application',
        data: { lateFeesApplied: 0 },
        processedAt: new Date().toISOString(),
      };
    }

    let appliedCount = 0;
    const errors: Array<{ tenancyId: string; error: string }> = [];

    for (const tenancy of tenanciesWithOverdue) {
      try {
        const lateFeePercent = Number(tenancy.lateFeePercent);
        const lateFee = await this.calculateLateFee(tenancy.id, lateFeePercent);

        if (lateFee <= 0) continue;

        // Find the most recent overdue bill to add the late fee to
        const targetBill = await this.prisma.rentBilling.findFirst({
          where: {
            tenancyId: tenancy.id,
            status: RentBillingStatus.OVERDUE,
          },
          orderBy: { billingPeriod: 'desc' },
          select: { id: true },
        });

        if (!targetBill) continue;

        // Add late fee line item and update totals
        await this.prisma.$transaction(async (tx) => {
          await tx.rentBillingLineItem.create({
            data: {
              billingId: targetBill.id,
              description: `Late fee (${lateFeePercent}% on overdue balance)`,
              type: 'LATE_FEE',
              amount: lateFee,
            },
          });

          await tx.rentBilling.update({
            where: { id: targetBill.id },
            data: {
              lateFee: { increment: lateFee },
              totalAmount: { increment: lateFee },
              balanceDue: { increment: lateFee },
            },
          });
        });

        appliedCount++;

        this.logger.debug(
          `Applied late fee RM${lateFee.toFixed(2)} to bill ${targetBill.id} for tenancy ${tenancy.id}`,
        );
      } catch (error) {
        const err = error as Error;
        errors.push({ tenancyId: tenancy.id, error: err.message });
        this.logger.error(
          `Failed to apply late fee for tenancy ${tenancy.id}: ${err.message}`,
        );
      }
    }

    this.logger.log(
      `Applied late fees to ${appliedCount} of ${tenanciesWithOverdue.length} tenancies for partner ${partnerId}`,
    );

    return {
      success: true,
      message: `Applied late fees to ${appliedCount} tenancies`,
      data: {
        lateFeesApplied: appliedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Handle process-reminders: emit event so the domain-layer ReminderService
   * picks it up (avoids circular dependency between infra → module).
   */
  private async handleProcessReminders(
    job: Job<RentBillingProcessRemindersJob>,
  ): Promise<JobResult> {
    const { partnerId } = job.data;

    this.logger.log(`Processing payment reminders for partner ${partnerId}`);

    // Delegate to the domain layer via event
    this.eventEmitter.emit('billing.reminders.process', { partnerId });

    return {
      success: true,
      message: `Payment reminder processing queued for partner ${partnerId}`,
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Payout Monthly Run
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Process monthly payout calculations for all owners in a partner.
   *
   * Steps:
   * 1. Find all owners (vendors) with COMPLETED payments in the period
   * 2. For each owner, calculate gross rental, platform fee, and net payout
   * 3. Create OwnerPayout records with line items
   */
  private async handlePayoutMonthlyRun(
    job: Job<PayoutMonthlyRunJob>,
  ): Promise<JobResult> {
    const { partnerId, periodStart, periodEnd } = job.data;
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    this.logger.log(
      `Processing monthly payouts for partner ${partnerId}: ${periodStart} to ${periodEnd}`,
    );

    // Find all owners (vendors) who have tenancies with completed payments in this period
    const ownersWithPayments = await this.prisma.vendor.findMany({
      where: {
        partnerId,
        ownedTenancies: {
          some: {
            billings: {
              some: {
                payments: {
                  some: {
                    status: RentPaymentStatus.COMPLETED,
                    processedAt: { gte: start, lte: end },
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (ownersWithPayments.length === 0) {
      this.logger.log(`No owners with payments for partner ${partnerId} in period`);
      return {
        success: true,
        message: 'No owners with payments in period',
        data: { ownersProcessed: 0 },
        processedAt: new Date().toISOString(),
      };
    }

    const platformFeePercent = 10; // default; could be per-partner config
    let processed = 0;
    let failed = 0;
    const errors: Array<{ ownerId: string; error: string }> = [];

    for (const owner of ownersWithPayments) {
      try {
        // Check for existing payout in this period
        const existing = await this.prisma.ownerPayout.findFirst({
          where: {
            partnerId,
            ownerId: owner.id,
            periodStart: { lte: end },
            periodEnd: { gte: start },
            status: { notIn: [PayoutStatus.FAILED] },
          },
        });

        if (existing) {
          this.logger.debug(`Payout already exists for owner ${owner.id}, skipping`);
          continue;
        }

        // Get all tenancies for this owner
        const tenancies = await this.prisma.tenancy.findMany({
          where: {
            partnerId,
            ownerId: owner.id,
            status: {
              in: [
                TenancyStatus.ACTIVE,
                TenancyStatus.MAINTENANCE_HOLD,
                TenancyStatus.INSPECTION_PENDING,
                TenancyStatus.TERMINATION_REQUESTED,
                TenancyStatus.TERMINATED,
              ],
            },
          },
          select: { id: true, monthlyRent: true, listingId: true },
        });

        if (tenancies.length === 0) continue;

        // Calculate totals from completed payments
        let grossRental = 0;
        const lineItems: Array<{
          tenancyId: string;
          billingId: string | null;
          type: string;
          description: string;
          amount: number;
        }> = [];

        for (const tenancy of tenancies) {
          const payments = await this.prisma.rentPayment.findMany({
            where: {
              billing: { tenancyId: tenancy.id, tenancy: { partnerId } },
              status: RentPaymentStatus.COMPLETED,
              processedAt: { gte: start, lte: end },
            },
            select: {
              amount: true,
              billingId: true,
            },
          });

          for (const payment of payments) {
            const amount = Number(payment.amount);
            grossRental += amount;
            lineItems.push({
              tenancyId: tenancy.id,
              billingId: payment.billingId,
              type: 'RENTAL',
              description: `Rental payment for tenancy`,
              amount,
            });
          }
        }

        if (grossRental === 0) continue;

        // Calculate fees
        const platformFee = Math.round(grossRental * (platformFeePercent / 100) * 100) / 100;
        const netPayout = Math.round((grossRental - platformFee) * 100) / 100;

        // Generate payout number
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const count = await this.prisma.ownerPayout.count({
          where: { partnerId, payoutNumber: { startsWith: `PO-${yearMonth}` } },
        });
        const payoutNumber = `PO-${yearMonth}-${String(count + 1).padStart(4, '0')}`;

        // Create payout with line items
        const payout = await this.prisma.$transaction(async (tx) => {
          // Add platform fee line item
          lineItems.push({
            tenancyId: tenancies[0].id,
            billingId: null,
            type: 'PLATFORM_FEE',
            description: `Platform fee (${platformFeePercent}%)`,
            amount: -platformFee,
          });

          return tx.ownerPayout.create({
            data: {
              partnerId,
              ownerId: owner.id,
              payoutNumber,
              periodStart: start,
              periodEnd: end,
              status: PayoutStatus.CALCULATED,
              grossRental: new Decimal(grossRental),
              platformFee: new Decimal(platformFee),
              maintenanceCost: new Decimal(0),
              otherDeductions: new Decimal(0),
              netPayout: new Decimal(netPayout),
              lineItems: {
                create: lineItems.map((li) => ({
                  tenancyId: li.tenancyId,
                  billingId: li.billingId,
                  type: li.type,
                  description: li.description,
                  amount: new Decimal(li.amount),
                })),
              },
            },
          });
        });

        processed++;
        this.logger.log(
          `Created payout ${payoutNumber} for owner ${owner.name}: RM${netPayout.toFixed(2)}`,
        );

        this.eventEmitter.emit('payout.calculated', {
          payoutId: payout.id,
          ownerId: owner.id,
          partnerId,
          netPayout,
          payoutNumber,
        });
      } catch (error) {
        const err = error as Error;
        failed++;
        errors.push({ ownerId: owner.id, error: err.message });
        this.logger.error(`Failed to calculate payout for owner ${owner.id}: ${err.message}`);
      }
    }

    this.logger.log(
      `Monthly payout run complete for partner ${partnerId}: ${processed} processed, ${failed} failed`,
    );

    return {
      success: true,
      message: `Processed payouts for ${processed} owners`,
      data: {
        ownersProcessed: processed,
        ownersFailed: failed,
        errors: errors.length > 0 ? errors : undefined,
      },
      processedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a unique bill number.
   * Format: BILL-{YYYYMM}-{SEQUENCE}
   */
  private async generateBillNumber(partnerId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `BILL-${yearMonth}`;

    const count = await this.prisma.rentBilling.count({
      where: {
        billNumber: { startsWith: prefix },
        tenancy: { partnerId },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${sequence}`;
  }

  /**
   * Calculate late fee based on total overdue balance for a tenancy.
   */
  private async calculateLateFee(
    tenancyId: string,
    lateFeePercent: number,
  ): Promise<number> {
    if (!lateFeePercent || lateFeePercent === 0) return 0;

    const overdueBills = await this.prisma.rentBilling.findMany({
      where: {
        tenancyId,
        status: {
          in: [
            RentBillingStatus.OVERDUE,
            RentBillingStatus.SENT,
            RentBillingStatus.GENERATED,
          ],
        },
        dueDate: { lt: new Date() },
        balanceDue: { gt: 0 },
      },
      select: { balanceDue: true },
    });

    if (overdueBills.length === 0) return 0;

    const totalOverdue = overdueBills.reduce(
      (sum, bill) => sum + Number(bill.balanceDue),
      0,
    );

    return Math.round(totalOverdue * (lateFeePercent / 100) * 100) / 100;
  }
}
