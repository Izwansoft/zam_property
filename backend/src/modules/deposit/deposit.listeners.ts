import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepositStatus, TenancyStatus, ClaimStatus } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';

/**
 * Event listeners for deposit module.
 *
 * These are singleton-scoped (no PartnerContextService dependency)
 * so they can respond to domain events without a request context.
 */
@Injectable()
export class DepositEventListeners {
  private readonly logger = new Logger(DepositEventListeners.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * When a tenancy is terminated, auto-finalize deposit refunds.
   *
   * Steps:
   * 1. Find all COLLECTED/HELD deposits for the tenancy
   * 2. For each deposit, apply any approved claims as deductions
   * 3. Mark claims as SETTLED
   * 4. Update deposit with deductions and refundable amount
   * 5. Emit deposit.ready-for-refund event
   *
   * The actual refund processing (bank transfer) still requires manual approval
   * via POST /deposits/:id/refund. This just calculates and links deductions.
   */
  @OnEvent('tenancy.terminated')
  async handleTenancyTerminated(event: {
    tenancyId: string;
    partnerId: string;
  }): Promise<void> {
    try {
      // Find all deposits for this tenancy that are COLLECTED or HELD
      const deposits = await this.prisma.deposit.findMany({
        where: {
          tenancyId: event.tenancyId,
          tenancy: { partnerId: event.partnerId },
          status: { in: [DepositStatus.COLLECTED, DepositStatus.HELD] },
        },
        select: {
          id: true,
          type: true,
          amount: true,
          deductionClaims: true,
        },
      });

      if (deposits.length === 0) {
        this.logger.debug(`No deposits to finalize for tenancy ${event.tenancyId}`);
        return;
      }

      // Get all approved claims for this tenancy
      const approvedClaims = await this.prisma.claim.findMany({
        where: {
          tenancyId: event.tenancyId,
          tenancy: { partnerId: event.partnerId },
          status: {
            in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED],
          },
        },
        orderBy: { submittedAt: 'asc' },
      });

      let totalDeductionsApplied = 0;
      let claimsSettled = 0;

      for (const deposit of deposits) {
        const depositAmount = Number(deposit.amount);

        // Parse existing deductions
        interface DeductionEntry {
          claimId?: string;
          description: string;
          amount: number;
          addedAt: Date;
        }
        const existingDeductions: DeductionEntry[] = deposit.deductionClaims
          ? (deposit.deductionClaims as unknown as DeductionEntry[])
          : [];
        const alreadyLinkedClaimIds = new Set(
          existingDeductions.filter((d) => d.claimId).map((d) => d.claimId),
        );

        // Filter claims not yet linked to this deposit
        const newClaims = approvedClaims.filter(
          (c) => !alreadyLinkedClaimIds.has(c.id),
        );

        let runningDeductions = existingDeductions.reduce(
          (sum, d) => sum + d.amount,
          0,
        );

        const newDeductions: DeductionEntry[] = [];

        for (const claim of newClaims) {
          const deductionAmount = Number(claim.approvedAmount ?? claim.claimedAmount);
          const remainingCapacity = depositAmount - runningDeductions;

          if (remainingCapacity <= 0) break;

          const actualDeduction = Math.min(deductionAmount, remainingCapacity);

          newDeductions.push({
            claimId: claim.id,
            description: `${claim.type}: ${claim.title}`,
            amount: actualDeduction,
            addedAt: new Date(),
          });

          runningDeductions += actualDeduction;
          totalDeductionsApplied += actualDeduction;

          // Mark claim as SETTLED
          await this.prisma.claim.update({
            where: { id: claim.id },
            data: {
              status: ClaimStatus.SETTLED,
              settlementMethod: 'DEPOSIT_DEDUCTION',
              settledAt: new Date(),
            },
          });
          claimsSettled++;
        }

        // Update deposit with new deductions
        const allDeductions = [...existingDeductions, ...newDeductions];
        const refundableAmount = Math.max(0, depositAmount - runningDeductions);

        await this.prisma.deposit.update({
          where: { id: deposit.id },
          data: {
            deductionClaims: allDeductions as unknown as any,
            refundableAmount: refundableAmount,
            // Keep status as COLLECTED/HELD — actual refund is manual
          },
        });

        this.logger.log(
          `Deposit ${deposit.id} (${deposit.type}): ${newDeductions.length} deductions applied, ` +
            `refundable: RM${refundableAmount.toFixed(2)}`,
        );
      }

      this.logger.log(
        `Auto-finalized ${deposits.length} deposits for terminated tenancy ${event.tenancyId}: ` +
          `${claimsSettled} claims settled, total deductions: RM${totalDeductionsApplied.toFixed(2)}`,
      );

      // Emit event for notification
      this.eventEmitter.emit('deposit.ready-for-refund', {
        tenancyId: event.tenancyId,
        partnerId: event.partnerId,
        depositCount: deposits.length,
        claimsSettled,
        totalDeductions: totalDeductionsApplied,
      });
    } catch (error) {
      this.logger.error(
        `Failed to auto-finalize deposits for tenancy ${event.tenancyId}: ${(error as Error).message}`,
      );
    }
  }
}
