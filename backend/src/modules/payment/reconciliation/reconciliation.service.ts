import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RentPaymentStatus,
  RentBillingStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';

import {
  StatementQueryDto,
  ReassignPaymentDto,
  AdvancePaymentDto,
} from '../dto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Single entry in a statement of account */
export interface StatementEntry {
  date: Date;
  type: 'BILLING' | 'PAYMENT' | 'LATE_FEE' | 'CREDIT';
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

/** Full statement of account for a tenancy */
export interface StatementOfAccount {
  tenancyId: string;
  property: { id: string; title: string };
  owner: { id: string; name: string };
  tenant: { id: string; name: string; email: string };
  period: { from: Date; to: Date };
  openingBalance: number;
  entries: StatementEntry[];
  closingBalance: number;
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
  };
}

/** Result of reconciling a single billing */
export interface BillingReconciliationResult {
  billingId: string;
  billNumber: string;
  previousPaidAmount: number;
  reconciledPaidAmount: number;
  previousBalanceDue: number;
  reconciledBalanceDue: number;
  previousStatus: string;
  reconciledStatus: string;
  changed: boolean;
}

/** Result of reconciling all billings for a tenancy */
export interface TenancyReconciliationResult {
  tenancyId: string;
  billings: BillingReconciliationResult[];
  totalChanged: number;
}

/** Result of matching a payment to a bill */
export interface MatchResult {
  paymentId: string;
  matchedBillingId: string;
  matchedBillNumber: string;
  confidence: 'EXACT' | 'AMOUNT_MATCH' | 'CLOSEST_DATE' | 'MANUAL';
  reassigned: boolean;
}

/** Result of handling overpayment */
export interface OverpaymentResult {
  billingId: string;
  excessAmount: number;
  appliedToBillingId?: string;
  appliedToBillNumber?: string;
  creditPaymentId?: string;
}

/** Result of advance payment distribution */
export interface AdvancePaymentResult {
  tenancyId: string;
  totalAmount: number;
  distributed: Array<{
    billingId: string;
    billNumber: string;
    amount: number;
    paymentId: string;
    paymentNumber: string;
    billingFullyPaid: boolean;
  }>;
  remainingAmount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PAYABLE_STATUSES: RentBillingStatus[] = [
  RentBillingStatus.GENERATED,
  RentBillingStatus.SENT,
  RentBillingStatus.PARTIALLY_PAID,
  RentBillingStatus.OVERDUE,
];

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Match Payment to Bill
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Auto-match or reassign a payment to the best-matching billing.
   * If suggestedBillingId is provided, reassign to that billing (manual match).
   * Otherwise, auto-match by amount and date proximity.
   */
  async matchPaymentToBill(
    paymentId: string,
    suggestedBillingId?: string,
  ): Promise<MatchResult> {
    const payment = await this.prisma.rentPayment.findFirst({
      where: { id: paymentId },
      include: {
        billing: {
          select: { tenancyId: true, billNumber: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== RentPaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be matched');
    }

    const tenancyId = payment.billing?.tenancyId;
    if (!tenancyId) {
      throw new BadRequestException('Payment billing has no associated tenancy');
    }

    // Manual match: reassign to specified billing
    if (suggestedBillingId) {
      if (suggestedBillingId === payment.billingId) {
        return {
          paymentId,
          matchedBillingId: payment.billingId,
          matchedBillNumber: payment.billing!.billNumber,
          confidence: 'MANUAL',
          reassigned: false,
        };
      }

      await this.reassignPayment({
        paymentId,
        newBillingId: suggestedBillingId,
        reason: 'Manual match via reconciliation',
      });

      const newBilling = await this.prisma.rentBilling.findFirst({
        where: { id: suggestedBillingId },
      });

      return {
        paymentId,
        matchedBillingId: suggestedBillingId,
        matchedBillNumber: newBilling?.billNumber || '',
        confidence: 'MANUAL',
        reassigned: true,
      };
    }

    // Auto-match: find the best billing for this payment
    const paymentAmount = Number(payment.amount);
    const paymentDate = payment.paymentDate || payment.createdAt;

    // Find outstanding billings for the same tenancy
    const candidates = await this.prisma.rentBilling.findMany({
      where: {
        tenancyId,
        status: { in: PAYABLE_STATUSES },
        id: { not: payment.billingId },
      },
      orderBy: { billingPeriod: 'asc' },
    });

    if (candidates.length === 0) {
      // Already on the best match
      return {
        paymentId,
        matchedBillingId: payment.billingId,
        matchedBillNumber: payment.billing!.billNumber,
        confidence: 'EXACT',
        reassigned: false,
      };
    }

    // Strategy 1: Exact amount match (balanceDue == paymentAmount)
    const exactMatch = candidates.find(
      (b) => Math.abs(Number(b.balanceDue) - paymentAmount) < 0.01,
    );
    if (exactMatch) {
      await this.reassignPayment({
        paymentId,
        newBillingId: exactMatch.id,
        reason: 'Auto-matched by exact amount',
      });
      return {
        paymentId,
        matchedBillingId: exactMatch.id,
        matchedBillNumber: exactMatch.billNumber,
        confidence: 'AMOUNT_MATCH',
        reassigned: true,
      };
    }

    // Strategy 2: Closest billing period to payment date
    let closestBilling = candidates[0];
    let closestDiff = Math.abs(
      candidates[0].billingPeriod.getTime() - paymentDate.getTime(),
    );

    for (const candidate of candidates.slice(1)) {
      const diff = Math.abs(
        candidate.billingPeriod.getTime() - paymentDate.getTime(),
      );
      if (diff < closestDiff) {
        closestDiff = diff;
        closestBilling = candidate;
      }
    }

    await this.reassignPayment({
      paymentId,
      newBillingId: closestBilling.id,
      reason: 'Auto-matched by closest billing period',
    });

    return {
      paymentId,
      matchedBillingId: closestBilling.id,
      matchedBillNumber: closestBilling.billNumber,
      confidence: 'CLOSEST_DATE',
      reassigned: true,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Partial Payment
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Update billing status for partial payment.
   * Called internally when a payment doesn't cover the full balance.
   */
  async handlePartialPayment(
    tx: Prisma.TransactionClient,
    billingId: string,
    paymentAmount: number,
  ): Promise<void> {
    const billing = await tx.rentBilling.findFirst({
      where: { id: billingId },
    });

    if (!billing) return;

    const newPaidAmount = Number(billing.paidAmount) + paymentAmount;
    const newBalanceDue = Math.max(0, Number(billing.totalAmount) - newPaidAmount);

    const newStatus = this.determineNewBillingStatus(
      newPaidAmount,
      Number(billing.totalAmount),
      billing.status,
      billing.dueDate,
    );

    const updateData: Prisma.RentBillingUpdateInput = {
      paidAmount: Math.max(0, newPaidAmount),
      balanceDue: newBalanceDue,
      status: newStatus,
    };

    if (newStatus === RentBillingStatus.PAID) {
      updateData.paidDate = new Date();
    }

    await tx.rentBilling.update({
      where: { id: billingId },
      data: updateData,
    });

    if (newStatus !== billing.status) {
      this.eventEmitter.emit('billing.status.changed', {
        billingId,
        billNumber: billing.billNumber,
        previousStatus: billing.status,
        newStatus,
        paidAmount: newPaidAmount,
        balanceDue: newBalanceDue,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Overpayment
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Detect and handle overpayment on a billing.
   * If paidAmount exceeds totalAmount, apply excess as credit to next outstanding billing.
   */
  async handleOverpayment(billingId: string): Promise<OverpaymentResult> {
    const partnerId = this.PartnerContext.partnerId;

    const billing = await this.prisma.rentBilling.findFirst({
      where: { id: billingId },
      include: {
        payments: {
          where: { status: RentPaymentStatus.COMPLETED },
        },
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${billingId} not found`);
    }

    const actualPaid = billing.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalAmount = Number(billing.totalAmount);

    if (actualPaid <= totalAmount) {
      return { billingId, excessAmount: 0 };
    }

    const excess = Math.round((actualPaid - totalAmount) * 100) / 100;

    // Cap the current billing at totalAmount
    await this.prisma.rentBilling.update({
      where: { id: billingId },
      data: {
        paidAmount: totalAmount,
        balanceDue: 0,
        status: RentBillingStatus.PAID,
        paidDate: billing.paidDate || new Date(),
      },
    });

    // Find next outstanding billing for the same tenancy
    const nextBilling = await this.prisma.rentBilling.findFirst({
      where: {
        tenancyId: billing.tenancyId,
        id: { not: billingId },
        status: { in: PAYABLE_STATUSES },
      },
      orderBy: { billingPeriod: 'asc' },
    });

    if (!nextBilling) {
      this.logger.warn(
        `Overpayment of RM ${excess} on ${billing.billNumber} — no next billing to apply credit`,
      );

      this.eventEmitter.emit('reconciliation.overpayment.unresolved', {
        partnerId,
        billingId,
        billNumber: billing.billNumber,
        excessAmount: excess,
      });

      return { billingId, excessAmount: excess };
    }

    // Create credit payment against next billing
    const paymentNumber = await this.generatePaymentNumber();
    const receiptNumber = await this.generateReceiptNumber();
    const now = new Date();

    let creditPaymentId: string | undefined;

    await this.prisma.$transaction(async (tx) => {
      const creditPayment = await tx.rentPayment.create({
        data: {
          partnerId,
          billingId: nextBilling.id,
          paymentNumber,
          amount: excess,
          status: RentPaymentStatus.COMPLETED,
          method: 'CREDIT',
          currency: 'MYR',
          reference: `Credit from overpayment on ${billing.billNumber}`,
          receiptNumber,
          paymentDate: now,
          processedAt: now,
          payerName: 'System Credit',
        },
      });

      creditPaymentId = creditPayment.id;

      // Update next billing
      const newPaidAmount = Number(nextBilling.paidAmount) + excess;
      const newBalanceDue = Math.max(
        0,
        Number(nextBilling.totalAmount) - newPaidAmount,
      );
      const newStatus = this.determineNewBillingStatus(
        newPaidAmount,
        Number(nextBilling.totalAmount),
        nextBilling.status,
        nextBilling.dueDate,
      );

      await tx.rentBilling.update({
        where: { id: nextBilling.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
          paidDate: newStatus === RentBillingStatus.PAID ? now : null,
        },
      });
    });

    this.logger.log(
      `Applied overpayment credit of RM ${excess} from ${billing.billNumber} to ${nextBilling.billNumber}`,
    );

    this.eventEmitter.emit('reconciliation.overpayment.applied', {
      partnerId,
      sourceBillingId: billingId,
      targetBillingId: nextBilling.id,
      amount: excess,
      creditPaymentId,
    });

    return {
      billingId,
      excessAmount: excess,
      appliedToBillingId: nextBilling.id,
      appliedToBillNumber: nextBilling.billNumber,
      creditPaymentId,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Advance Payment
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Distribute a lump-sum payment across outstanding billings for a tenancy.
   * Applies payments starting from the oldest unpaid bill.
   */
  async handleAdvancePayment(
    dto: AdvancePaymentDto,
  ): Promise<AdvancePaymentResult> {
    const partnerId = this.PartnerContext.partnerId;

    // Validate tenancy
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: dto.tenancyId, partnerId },
      include: {
        tenant: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${dto.tenancyId} not found`);
    }

    // Find all outstanding billings, oldest first
    const outstandingBills = await this.prisma.rentBilling.findMany({
      where: {
        tenancyId: dto.tenancyId,
        status: { in: PAYABLE_STATUSES },
      },
      orderBy: { billingPeriod: 'asc' },
    });

    if (outstandingBills.length === 0) {
      throw new BadRequestException(
        'No outstanding billings to apply payment to',
      );
    }

    let remainingAmount = dto.amount;
    const distributed: AdvancePaymentResult['distributed'] = [];
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      for (const bill of outstandingBills) {
        if (remainingAmount <= 0) break;

        const balanceDue = Number(bill.balanceDue);
        const applyAmount = Math.min(remainingAmount, balanceDue);
        const applyAmountRounded =
          Math.round(applyAmount * 100) / 100;

        if (applyAmountRounded <= 0) continue;

        // Generate unique numbers for each payment
        const paymentNumber = await this.generatePaymentNumber();
        const receiptNumber = await this.generateReceiptNumber();

        // Create payment record
        const payment = await tx.rentPayment.create({
          data: {
            partnerId,
            billingId: bill.id,
            paymentNumber,
            amount: applyAmountRounded,
            status: RentPaymentStatus.COMPLETED,
            method: dto.method,
            currency: 'MYR',
            reference: dto.reference,
            receiptNumber,
            paymentDate: now,
            processedAt: now,
            payerName:
              dto.payerName || tenancy.tenant?.user?.fullName,
            payerEmail:
              dto.payerEmail || tenancy.tenant?.user?.email,
          },
        });

        // Update billing
        const newPaidAmount =
          Number(bill.paidAmount) + applyAmountRounded;
        const newBalanceDue = Math.max(
          0,
          Number(bill.totalAmount) - newPaidAmount,
        );
        const billingFullyPaid = newBalanceDue <= 0;
        const newStatus = this.determineNewBillingStatus(
          newPaidAmount,
          Number(bill.totalAmount),
          bill.status,
          bill.dueDate,
        );

        await tx.rentBilling.update({
          where: { id: bill.id },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalanceDue,
            status: newStatus,
            paidDate: newStatus === RentBillingStatus.PAID ? now : null,
          },
        });

        distributed.push({
          billingId: bill.id,
          billNumber: bill.billNumber,
          amount: applyAmountRounded,
          paymentId: payment.id,
          paymentNumber,
          billingFullyPaid,
        });

        remainingAmount -= applyAmountRounded;

        // Emit payment event for each billing paid
        this.eventEmitter.emit('rent.payment.completed', {
          partnerId,
          paymentId: payment.id,
          billingId: bill.id,
          billNumber: bill.billNumber,
          paymentNumber,
          amount: applyAmountRounded,
          method: dto.method,
          receiptNumber,
        });
      }
    });

    const remainingRounded = Math.round(remainingAmount * 100) / 100;

    if (remainingRounded > 0) {
      this.logger.warn(
        `Advance payment for tenancy ${dto.tenancyId}: RM ${remainingRounded} remaining after distributing across all outstanding bills`,
      );
    }

    this.logger.log(
      `Advance payment of RM ${dto.amount} distributed across ${distributed.length} billings for tenancy ${dto.tenancyId}`,
    );

    return {
      tenancyId: dto.tenancyId,
      totalAmount: dto.amount,
      distributed,
      remainingAmount: remainingRounded,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reassign Payment
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Reassign a completed payment from one billing to another.
   * Reverses the payment on the old billing and applies to the new one.
   */
  async reassignPayment(dto: ReassignPaymentDto): Promise<any> {
    const partnerId = this.PartnerContext.partnerId;

    // Validate payment
    const payment = await this.prisma.rentPayment.findFirst({
      where: { id: dto.paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${dto.paymentId} not found`);
    }
    if (payment.status !== RentPaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Only completed payments can be reassigned',
      );
    }
    if (payment.billingId === dto.newBillingId) {
      throw new BadRequestException(
        'Payment is already assigned to this billing',
      );
    }

    // Validate old billing
    const oldBilling = await this.prisma.rentBilling.findFirst({
      where: { id: payment.billingId },
    });
    if (!oldBilling) {
      throw new NotFoundException('Original billing not found');
    }

    // Validate new billing
    const newBilling = await this.prisma.rentBilling.findFirst({
      where: { id: dto.newBillingId },
    });
    if (!newBilling) {
      throw new NotFoundException(
        `Target billing ${dto.newBillingId} not found`,
      );
    }

    const paymentAmount = Number(payment.amount);

    await this.prisma.$transaction(async (tx) => {
      // 1. Reverse old billing
      const oldPaidAmount = Math.max(
        0,
        Number(oldBilling.paidAmount) - paymentAmount,
      );
      const oldBalanceDue = Math.max(
        0,
        Number(oldBilling.totalAmount) - oldPaidAmount,
      );
      const oldNewStatus = this.determineReversedBillingStatus(
        oldPaidAmount,
        Number(oldBilling.totalAmount),
        oldBilling.status,
        oldBilling.dueDate,
      );

      await tx.rentBilling.update({
        where: { id: oldBilling.id },
        data: {
          paidAmount: oldPaidAmount,
          balanceDue: oldBalanceDue,
          status: oldNewStatus,
          paidDate:
            oldNewStatus === RentBillingStatus.PAID
              ? oldBilling.paidDate
              : null,
        },
      });

      // 2. Apply to new billing
      const newPaidAmount = Number(newBilling.paidAmount) + paymentAmount;
      const newBalanceDue = Math.max(
        0,
        Number(newBilling.totalAmount) - newPaidAmount,
      );
      const newNewStatus = this.determineNewBillingStatus(
        newPaidAmount,
        Number(newBilling.totalAmount),
        newBilling.status,
        newBilling.dueDate,
      );

      await tx.rentBilling.update({
        where: { id: newBilling.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newNewStatus,
          paidDate:
            newNewStatus === RentBillingStatus.PAID ? new Date() : null,
        },
      });

      // 3. Reassign the payment
      await tx.rentPayment.update({
        where: { id: payment.id },
        data: { billingId: dto.newBillingId },
      });
    });

    this.eventEmitter.emit('rent.payment.reassigned', {
      partnerId,
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      oldBillingId: oldBilling.id,
      oldBillNumber: oldBilling.billNumber,
      newBillingId: dto.newBillingId,
      newBillNumber: newBilling.billNumber,
      amount: paymentAmount,
      reason: dto.reason,
    });

    this.logger.log(
      `Payment ${payment.paymentNumber} reassigned from ${oldBilling.billNumber} to ${newBilling.billNumber}`,
    );

    // Return updated payment with billing
    return this.prisma.rentPayment.findFirst({
      where: { id: payment.id },
      include: {
        billing: {
          select: {
            id: true,
            billNumber: true,
            billingPeriod: true,
            totalAmount: true,
            balanceDue: true,
            status: true,
          },
        },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reconcile Billing
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Recalculate a billing's paidAmount from its COMPLETED payments.
   * Fixes discrepancies between payment records and billing amounts.
   */
  async reconcileBilling(
    billingId: string,
  ): Promise<BillingReconciliationResult> {
    const billing = await this.prisma.rentBilling.findFirst({
      where: { id: billingId },
      include: {
        payments: {
          where: { status: RentPaymentStatus.COMPLETED },
        },
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${billingId} not found`);
    }

    const actualPaidAmount = billing.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const actualPaidRounded = Math.round(actualPaidAmount * 100) / 100;
    const totalAmount = Number(billing.totalAmount);
    const newBalanceDue = Math.max(0, totalAmount - actualPaidRounded);

    const newStatus = this.determineNewBillingStatus(
      actualPaidRounded,
      totalAmount,
      billing.status,
      billing.dueDate,
    );

    const previousPaidAmount = Number(billing.paidAmount);
    const previousBalanceDue = Number(billing.balanceDue);

    const changed =
      Math.abs(actualPaidRounded - previousPaidAmount) > 0.001 ||
      Math.abs(newBalanceDue - previousBalanceDue) > 0.001 ||
      newStatus !== billing.status;

    if (changed) {
      const updateData: Prisma.RentBillingUpdateInput = {
        paidAmount: actualPaidRounded,
        balanceDue: newBalanceDue,
        status: newStatus,
      };

      if (newStatus === RentBillingStatus.PAID && !billing.paidDate) {
        updateData.paidDate = new Date();
      }

      await this.prisma.rentBilling.update({
        where: { id: billingId },
        data: updateData,
      });

      this.logger.log(
        `Reconciled billing ${billing.billNumber}: paidAmount ${previousPaidAmount} → ${actualPaidRounded}, status ${billing.status} → ${newStatus}`,
      );

      this.eventEmitter.emit('reconciliation.billing.reconciled', {
        billingId,
        billNumber: billing.billNumber,
        previousPaidAmount,
        reconciledPaidAmount: actualPaidRounded,
        previousStatus: billing.status,
        reconciledStatus: newStatus,
      });
    }

    return {
      billingId,
      billNumber: billing.billNumber,
      previousPaidAmount,
      reconciledPaidAmount: actualPaidRounded,
      previousBalanceDue,
      reconciledBalanceDue: newBalanceDue,
      previousStatus: billing.status,
      reconciledStatus: newStatus,
      changed,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reconcile Tenancy (all billings)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Batch-reconcile all billings for a tenancy.
   */
  async reconcileTenancy(
    tenancyId: string,
  ): Promise<TenancyReconciliationResult> {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${tenancyId} not found`);
    }

    const billings = await this.prisma.rentBilling.findMany({
      where: { tenancyId },
      orderBy: { billingPeriod: 'asc' },
    });

    const results: BillingReconciliationResult[] = [];

    for (const billing of billings) {
      const result = await this.reconcileBilling(billing.id);
      results.push(result);
    }

    const totalChanged = results.filter((r) => r.changed).length;

    this.logger.log(
      `Reconciled tenancy ${tenancyId}: ${totalChanged}/${billings.length} billings changed`,
    );

    return {
      tenancyId,
      billings: results,
      totalChanged,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statement of Account
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a complete statement of account for a tenancy.
   * Shows all billings and payments with running balance.
   */
  async getStatementOfAccount(
    tenancyId: string,
    query: StatementQueryDto,
  ): Promise<StatementOfAccount> {
    // Validate tenancy
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId },
      include: {
        listing: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true } },
        tenant: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${tenancyId} not found`);
    }

    // Determine date range
    const fromDate = query.fromDate
      ? new Date(query.fromDate)
      : tenancy.leaseStartDate || tenancy.createdAt;
    const toDate = query.toDate ? new Date(query.toDate) : new Date();

    // Calculate opening balance (billed - paid BEFORE fromDate)
    const [priorBilledAgg, priorPaidAgg] = await Promise.all([
      this.prisma.rentBilling.aggregate({
        where: {
          tenancyId,
          issueDate: { lt: fromDate },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.rentPayment.aggregate({
        where: {
          billing: { tenancyId },
          status: RentPaymentStatus.COMPLETED,
          paymentDate: { lt: fromDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const priorBilled = Number(priorBilledAgg._sum.totalAmount || 0);
    const priorPaid = Number(priorPaidAgg._sum.amount || 0);
    const openingBalance = Math.round((priorBilled - priorPaid) * 100) / 100;

    // Get billings and payments within period
    const [billings, payments] = await Promise.all([
      this.prisma.rentBilling.findMany({
        where: {
          tenancyId,
          issueDate: { gte: fromDate, lte: toDate },
        },
        orderBy: { issueDate: 'asc' },
      }),
      this.prisma.rentPayment.findMany({
        where: {
          billing: { tenancyId },
          status: RentPaymentStatus.COMPLETED,
          paymentDate: { gte: fromDate, lte: toDate },
        },
        orderBy: { paymentDate: 'asc' },
      }),
    ]);

    // Build statement entries (merge billings and payments, sorted by date)
    const rawEntries: Array<{
      date: Date;
      sortKey: number;
      entry: StatementEntry;
    }> = [];

    for (const billing of billings) {
      const amount = Number(billing.totalAmount);
      const billingDate = billing.issueDate;

      rawEntries.push({
        date: billingDate,
        sortKey: 0, // Debits come first when same date
        entry: {
          date: billingDate,
          type: 'BILLING',
          description: `Rent for ${this.formatPeriod(billing.billingPeriod)}`,
          reference: billing.billNumber,
          debit: amount,
          credit: 0,
          balance: 0, // Calculated after sorting
        },
      });

      // Add late fee as separate entry if applicable
      const lateFee = Number(billing.lateFee);
      if (lateFee > 0) {
        rawEntries.push({
          date: billing.dueDate, // Late fee applied at due date
          sortKey: 0,
          entry: {
            date: billing.dueDate,
            type: 'LATE_FEE',
            description: `Late fee for ${billing.billNumber}`,
            reference: billing.billNumber,
            debit: lateFee,
            credit: 0,
            balance: 0,
          },
        });
      }
    }

    for (const payment of payments) {
      const amount = Number(payment.amount);
      const pmtDate = payment.paymentDate || payment.createdAt;
      const isCredit = payment.method === 'CREDIT';

      rawEntries.push({
        date: pmtDate,
        sortKey: 1, // Credits come after debits when same date
        entry: {
          date: pmtDate,
          type: isCredit ? 'CREDIT' : 'PAYMENT',
          description: isCredit
            ? `Credit applied — ${payment.reference || 'Overpayment credit'}`
            : `Payment — ${payment.method}`,
          reference: payment.paymentNumber,
          debit: 0,
          credit: amount,
          balance: 0,
        },
      });
    }

    // Sort by date, then debits before credits
    rawEntries.sort((a, b) => {
      const timeDiff = a.date.getTime() - b.date.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.sortKey - b.sortKey;
    });

    // Calculate running balance
    let runningBalance = openingBalance;
    const entries: StatementEntry[] = rawEntries.map(({ entry }) => {
      runningBalance += entry.debit - entry.credit;
      const rounded = Math.round(runningBalance * 100) / 100;
      return { ...entry, balance: rounded };
    });

    // Calculate summary
    const totalBilled = billings.reduce(
      (sum, b) => sum + Number(b.totalAmount),
      0,
    );
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalOverdue = billings
      .filter((b) => b.status === RentBillingStatus.OVERDUE)
      .reduce((sum, b) => sum + Number(b.balanceDue), 0);

    const closingBalance =
      Math.round((openingBalance + totalBilled - totalPaid) * 100) / 100;

    return {
      tenancyId,
      property: { id: tenancy.listing.id, title: tenancy.listing.title },
      owner: { id: tenancy.owner.id, name: tenancy.owner.name },
      tenant: {
        id: tenancy.tenant.id,
        name: tenancy.tenant.user.fullName,
        email: tenancy.tenant.user.email,
      },
      period: { from: fromDate, to: toDate },
      openingBalance,
      entries,
      closingBalance,
      summary: {
        totalBilled: Math.round(totalBilled * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOutstanding: closingBalance,
        totalOverdue: Math.round(totalOverdue * 100) / 100,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Determine new billing status based on paid amount.
   */
  private determineNewBillingStatus(
    paidAmount: number,
    totalAmount: number,
    currentStatus: RentBillingStatus,
    dueDate: Date,
  ): RentBillingStatus {
    if (paidAmount >= totalAmount) {
      return RentBillingStatus.PAID;
    }
    if (paidAmount > 0) {
      return RentBillingStatus.PARTIALLY_PAID;
    }
    return currentStatus;
  }

  /**
   * Determine billing status when a payment is reversed/removed.
   */
  private determineReversedBillingStatus(
    paidAmount: number,
    totalAmount: number,
    currentStatus: RentBillingStatus,
    dueDate: Date,
  ): RentBillingStatus {
    if (paidAmount >= totalAmount) {
      return RentBillingStatus.PAID;
    }
    if (paidAmount > 0) {
      return RentBillingStatus.PARTIALLY_PAID;
    }
    // No payments left: revert to appropriate status
    if (
      currentStatus === RentBillingStatus.PAID ||
      currentStatus === RentBillingStatus.PARTIALLY_PAID
    ) {
      return new Date() > dueDate
        ? RentBillingStatus.OVERDUE
        : RentBillingStatus.SENT;
    }
    return currentStatus;
  }

  /**
   * Format a billing period date as "Month YYYY"
   */
  private formatPeriod(date: Date): string {
    return date.toLocaleDateString('en-MY', {
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Generate unique payment number: PAY-YYYYMM-NNNN
   */
  private async generatePaymentNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PAY-${year}${month}`;

    const lastPayment = await this.prisma.rentPayment.findFirst({
      where: { paymentNumber: { startsWith: prefix } },
      orderBy: { paymentNumber: 'desc' },
    });

    let sequence = 1;
    if (lastPayment) {
      const lastSeq = parseInt(
        lastPayment.paymentNumber.split('-').pop() || '0',
        10,
      );
      sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate unique receipt number: RCP-YYYYMM-NNNN
   */
  private async generateReceiptNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `RCP-${year}${month}`;

    const lastPayment = await this.prisma.rentPayment.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: 'desc' },
    });

    let sequence = 1;
    if (lastPayment) {
      const lastSeq = parseInt(
        lastPayment.receiptNumber!.split('-').pop() || '0',
        10,
      );
      sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
