import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PayoutStatus, RentPaymentStatus, TenancyStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as PDFDocument from 'pdfkit';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Line item type constants */
export const LINE_ITEM_TYPES = {
  RENTAL: 'RENTAL',
  PLATFORM_FEE: 'PLATFORM_FEE',
  MAINTENANCE: 'MAINTENANCE',
  CLAIM_DEDUCTION: 'CLAIM_DEDUCTION',
  OTHER: 'OTHER',
} as const;

export type LineItemType = (typeof LINE_ITEM_TYPES)[keyof typeof LINE_ITEM_TYPES];

/** View type for a payout */
export interface PayoutView {
  id: string;
  ownerId: string;
  ownerName: string;
  payoutNumber: string;
  periodStart: Date;
  periodEnd: Date;
  status: PayoutStatus;
  grossRental: number;
  platformFee: number;
  maintenanceCost: number;
  otherDeductions: number;
  netPayout: number;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  processedAt: Date | null;
  bankReference: string | null;
  lineItems: PayoutLineItemView[];
  createdAt: Date;
  updatedAt: Date;
}

/** View type for a line item */
export interface PayoutLineItemView {
  id: string;
  tenancyId: string;
  billingId: string | null;
  type: string;
  description: string;
  amount: number;
}

/** Result of payout calculation */
export interface CalculatePayoutResult {
  payoutId: string;
  payoutNumber: string;
  ownerId: string;
  ownerName: string;
  periodStart: Date;
  periodEnd: Date;
  grossRental: number;
  platformFee: number;
  maintenanceCost: number;
  otherDeductions: number;
  netPayout: number;
  lineItemCount: number;
  tenancyCount: number;
}

/** Payout list query result */
export interface PayoutListResult {
  data: PayoutView[];
  total: number;
  page: number;
  limit: number;
}

/** Result of approving a payout */
export interface ApprovePayoutResult {
  payoutId: string;
  payoutNumber: string;
  status: PayoutStatus;
  approvedBy: string;
  approvedAt: Date;
}

/** Result of batch processing */
export interface ProcessBatchResult {
  processed: number;
  failed: number;
  results: Array<{
    payoutId: string;
    payoutNumber: string;
    status: 'COMPLETED' | 'FAILED';
    error?: string;
  }>;
}

/** Bank file CSV row */
export interface BankFileRow {
  payoutNumber: string;
  ownerName: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  amount: string;
  reference: string;
  currency: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default platform fee percentage (configurable per partner in the future) */
const DEFAULT_PLATFORM_FEE_PERCENT = 10;

/** Tenancy statuses eligible for payout calculation */
const PAYOUT_ELIGIBLE_STATUSES: TenancyStatus[] = [
  TenancyStatus.ACTIVE,
  TenancyStatus.MAINTENANCE_HOLD,
  TenancyStatus.INSPECTION_PENDING,
  TenancyStatus.TERMINATION_REQUESTED,
  TenancyStatus.TERMINATED,
];

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Calculate Payout
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calculate payout for an owner (Vendor) over a period.
   *
   * Steps:
   * 1. Find all tenancies owned by this vendor
   * 2. Sum COMPLETED payments for those tenancies within period
   * 3. Calculate platform fee
   * 4. Create payout record with line items
   */
  async calculatePayout(
    ownerId: string,
    periodStart: Date,
    periodEnd: Date,
    platformFeePercent: number = DEFAULT_PLATFORM_FEE_PERCENT,
  ): Promise<CalculatePayoutResult> {
    const partnerId = this.PartnerContext.partnerId;

    // Validate owner exists
    const owner = await this.prisma.vendor.findFirst({
      where: { id: ownerId, partnerId },
    });

    if (!owner) {
      throw new NotFoundException(`Owner (vendor) ${ownerId} not found`);
    }

    // Validate dates
    if (periodStart >= periodEnd) {
      throw new BadRequestException('periodStart must be before periodEnd');
    }

    // Check for existing payout for same owner + overlapping period
    const existingPayout = await this.prisma.ownerPayout.findFirst({
      where: {
        partnerId,
        ownerId,
        periodStart: { lte: periodEnd },
        periodEnd: { gte: periodStart },
        status: { notIn: [PayoutStatus.FAILED] },
      },
    });

    if (existingPayout) {
      throw new BadRequestException(
        `Payout ${existingPayout.payoutNumber} already exists for overlapping period ` +
        `(${existingPayout.periodStart.toISOString().slice(0, 10)} to ${existingPayout.periodEnd.toISOString().slice(0, 10)})`,
      );
    }

    // Find all tenancies owned by this vendor
    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        partnerId,
        ownerId,
        status: { in: PAYOUT_ELIGIBLE_STATUSES },
      },
      include: {
        listing: { select: { id: true, title: true } },
        tenant: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (tenancies.length === 0) {
      throw new BadRequestException(
        `No eligible tenancies found for owner ${owner.name}`,
      );
    }

    const tenancyIds = tenancies.map((t) => t.id);

    // Find all COMPLETED payments for these tenancies in the period
    const payments = await this.prisma.rentPayment.findMany({
      where: {
        partnerId,
        billing: { tenancyId: { in: tenancyIds } },
        status: RentPaymentStatus.COMPLETED,
        paymentDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        billing: {
          select: {
            id: true,
            tenancyId: true,
            billNumber: true,
            billingPeriod: true,
          },
        },
      },
    });

    // Build line items grouped by tenancy
    const lineItemsData: Array<{
      tenancyId: string;
      billingId: string | null;
      type: string;
      description: string;
      amount: number;
    }> = [];

    // Track totals per tenancy for rental income
    const tenancyTotals = new Map<string, number>();

    for (const payment of payments) {
      const tenancyId = payment.billing.tenancyId;
      const amount = Number(payment.amount);
      const current = tenancyTotals.get(tenancyId) || 0;
      tenancyTotals.set(tenancyId, current + amount);

      lineItemsData.push({
        tenancyId,
        billingId: payment.billing.id,
        type: LINE_ITEM_TYPES.RENTAL,
        description: `Rent payment — ${payment.billing.billNumber} (${payment.paymentNumber})`,
        amount,
      });
    }

    // Calculate gross rental
    const grossRental = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // Calculate platform fee
    const platformFee = Math.round(grossRental * (platformFeePercent / 100) * 100) / 100;

    // Add platform fee as negative line item per tenancy
    for (const [tenancyId, total] of tenancyTotals.entries()) {
      const fee = Math.round(total * (platformFeePercent / 100) * 100) / 100;
      lineItemsData.push({
        tenancyId,
        billingId: null,
        type: LINE_ITEM_TYPES.PLATFORM_FEE,
        description: `Platform fee (${platformFeePercent}%)`,
        amount: -fee,
      });
    }

    // TODO: In future sessions, include maintenance costs and claim deductions
    const maintenanceCost = 0;
    const otherDeductions = 0;

    // Net payout
    const netPayout = Math.round((grossRental - platformFee - maintenanceCost - otherDeductions) * 100) / 100;

    // Generate payout number
    const payoutNumber = await this.generatePayoutNumber(partnerId);

    // Create payout + line items in transaction
    const payout = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ownerPayout.create({
        data: {
          partnerId,
          ownerId,
          payoutNumber,
          periodStart,
          periodEnd,
          status: PayoutStatus.CALCULATED,
          grossRental: new Decimal(grossRental),
          platformFee: new Decimal(platformFee),
          maintenanceCost: new Decimal(maintenanceCost),
          otherDeductions: new Decimal(otherDeductions),
          netPayout: new Decimal(netPayout),
          lineItems: {
            create: lineItemsData.map((li) => ({
              tenancyId: li.tenancyId,
              billingId: li.billingId,
              type: li.type,
              description: li.description,
              amount: new Decimal(li.amount),
            })),
          },
        },
        include: {
          lineItems: true,
        },
      });

      return created;
    });

    // Emit event
    this.eventEmitter.emit('payout.calculated', {
      partnerId,
      payoutId: payout.id,
      payoutNumber,
      ownerId,
      ownerName: owner.name,
      grossRental,
      platformFee,
      netPayout,
      periodStart,
      periodEnd,
    });

    this.logger.log(
      `Payout ${payoutNumber} calculated for owner ${owner.name}: ` +
      `gross=MYR ${grossRental.toFixed(2)}, fee=MYR ${platformFee.toFixed(2)}, ` +
      `net=MYR ${netPayout.toFixed(2)} (${payments.length} payments across ${tenancyTotals.size} tenancies)`,
    );

    return {
      payoutId: payout.id,
      payoutNumber,
      ownerId,
      ownerName: owner.name,
      periodStart,
      periodEnd,
      grossRental,
      platformFee,
      maintenanceCost,
      otherDeductions,
      netPayout,
      lineItemCount: payout.lineItems.length,
      tenancyCount: tenancyTotals.size,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Get Payout
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get a single payout by ID with all line items.
   */
  async getPayout(payoutId: string): Promise<PayoutView> {
    const partnerId = this.PartnerContext.partnerId;

    const payout = await this.prisma.ownerPayout.findFirst({
      where: { id: payoutId, partnerId },
      include: {
        owner: { select: { name: true } },
        lineItems: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout ${payoutId} not found`);
    }

    return this.toPayoutView(payout);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Approve Payout
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Approve a calculated payout for processing.
   * Only CALCULATED payouts can be approved.
   */
  async approvePayout(
    payoutId: string,
    approvedBy: string,
  ): Promise<ApprovePayoutResult> {
    const partnerId = this.PartnerContext.partnerId;

    const payout = await this.prisma.ownerPayout.findFirst({
      where: { id: payoutId, partnerId },
      include: { owner: { select: { name: true } } },
    });

    if (!payout) {
      throw new NotFoundException(`Payout ${payoutId} not found`);
    }

    if (payout.status !== PayoutStatus.CALCULATED) {
      throw new BadRequestException(
        `Payout ${payout.payoutNumber} cannot be approved — current status: ${payout.status}`,
      );
    }

    // Bank details are already snapshotted on the payout record at calculation time.
    // We just transition the status and record the approver.
    const now = new Date();

    const updated = await this.prisma.ownerPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.APPROVED,
        approvedBy,
        approvedAt: now,
      },
    });

    this.eventEmitter.emit('payout.approved', {
      partnerId,
      payoutId,
      payoutNumber: payout.payoutNumber,
      ownerId: payout.ownerId,
      ownerName: payout.owner?.name,
      netPayout: Number(payout.netPayout),
      approvedBy,
    });

    this.logger.log(
      `Payout ${payout.payoutNumber} approved by ${approvedBy} — MYR ${Number(payout.netPayout).toFixed(2)}`,
    );

    return {
      payoutId: updated.id,
      payoutNumber: updated.payoutNumber,
      status: updated.status,
      approvedBy,
      approvedAt: now,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Process Batch
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Process a batch of approved payouts — marks them as PROCESSING then COMPLETED.
   * In production, this would trigger bank transfers. For now, it simulates processing.
   */
  async processBatch(payoutIds?: string[]): Promise<ProcessBatchResult> {
    const partnerId = this.PartnerContext.partnerId;

    // Find all APPROVED payouts (or specific ones)
    const where: any = {
      partnerId,
      status: PayoutStatus.APPROVED,
    };
    if (payoutIds && payoutIds.length > 0) {
      where.id = { in: payoutIds };
    }

    const payouts = await this.prisma.ownerPayout.findMany({
      where,
      include: {
        owner: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (payouts.length === 0) {
      throw new BadRequestException('No approved payouts found to process');
    }

    const results: ProcessBatchResult['results'] = [];
    let processed = 0;
    let failed = 0;

    for (const payout of payouts) {
      try {
        // Mark as PROCESSING
        await this.prisma.ownerPayout.update({
          where: { id: payout.id },
          data: { status: PayoutStatus.PROCESSING },
        });

        // Simulate processing — in production, integrate with bank API
        const bankReference = `REF-${payout.payoutNumber}-${Date.now()}`;

        // Mark as COMPLETED
        await this.prisma.ownerPayout.update({
          where: { id: payout.id },
          data: {
            status: PayoutStatus.COMPLETED,
            processedAt: new Date(),
            bankReference,
          },
        });

        this.eventEmitter.emit('payout.completed', {
          partnerId,
          payoutId: payout.id,
          payoutNumber: payout.payoutNumber,
          ownerId: payout.ownerId,
          ownerName: payout.owner?.name,
          netPayout: Number(payout.netPayout),
          bankReference,
        });

        results.push({
          payoutId: payout.id,
          payoutNumber: payout.payoutNumber,
          status: 'COMPLETED',
        });
        processed++;
      } catch (error) {
        // Mark as FAILED
        await this.prisma.ownerPayout.update({
          where: { id: payout.id },
          data: { status: PayoutStatus.FAILED },
        });

        this.eventEmitter.emit('payout.failed', {
          partnerId,
          payoutId: payout.id,
          payoutNumber: payout.payoutNumber,
          error: (error as Error).message,
        });

        results.push({
          payoutId: payout.id,
          payoutNumber: payout.payoutNumber,
          status: 'FAILED',
          error: (error as Error).message,
        });
        failed++;
      }
    }

    this.logger.log(
      `Batch payout processing complete: ${processed} processed, ${failed} failed`,
    );

    return { processed, failed, results };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Bank File (CSV)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a CSV bank file for bulk transfer of approved payouts.
   * Format: Standard CSV compatible with Malaysian banks (IBG/FPX bulk transfer).
   */
  async generateBankFile(payoutIds?: string[]): Promise<{ csv: string; filename: string; count: number }> {
    const partnerId = this.PartnerContext.partnerId;

    const where: any = {
      partnerId,
      status: { in: [PayoutStatus.APPROVED, PayoutStatus.PROCESSING] },
    };
    if (payoutIds && payoutIds.length > 0) {
      where.id = { in: payoutIds };
    }

    const payouts = await this.prisma.ownerPayout.findMany({
      where,
      include: {
        owner: { select: { name: true } },
      },
      orderBy: { payoutNumber: 'asc' },
    });

    if (payouts.length === 0) {
      throw new BadRequestException('No approved payouts found for bank file generation');
    }

    // CSV header
    const headers = [
      'Payout Number',
      'Beneficiary Name',
      'Bank Name',
      'Account Number',
      'Account Holder Name',
      'Amount (MYR)',
      'Reference',
      'Currency',
    ];

    const rows: string[][] = payouts.map((p) => [
      p.payoutNumber,
      p.owner?.name || '',
      p.bankName || '',
      p.bankAccount || '',
      p.bankAccountName || '',
      Number(p.netPayout).toFixed(2),
      `REF-${p.payoutNumber}`,
      'MYR',
    ]);

    // Build CSV
    const escapeCsv = (val: string): string => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ];

    const totalAmount = payouts.reduce((sum, p) => sum + Number(p.netPayout), 0);
    csvLines.push(''); // Empty line
    csvLines.push(`Total Records,${payouts.length},,,,${totalAmount.toFixed(2)},,`);

    const csv = csvLines.join('\n');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `payout-bank-file-${dateStr}.csv`;

    this.logger.log(
      `Generated bank file: ${filename} — ${payouts.length} payouts, total MYR ${totalAmount.toFixed(2)}`,
    );

    return { csv, filename, count: payouts.length };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Payout Statement PDF
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a payout statement PDF for an owner.
   */
  async generatePayoutStatementPdf(
    payoutId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const payout = await this.getPayout(payoutId);

    const buffer = await this.generatePdfFromPayout(payout);
    const filename = `${payout.payoutNumber}-statement.pdf`;

    this.logger.log(`Generated payout statement PDF: ${filename}`);

    return { buffer, filename };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // List Payouts
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List payouts with filtering and pagination.
   */
  async listPayouts(options: {
    ownerId?: string;
    status?: PayoutStatus;
    periodStart?: Date;
    periodEnd?: Date;
    page?: number;
    limit?: number;
  }): Promise<PayoutListResult> {
    const partnerId = this.PartnerContext.partnerId;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { partnerId };

    if (options.ownerId) {
      where.ownerId = options.ownerId;
    }
    if (options.status) {
      where.status = options.status;
    }
    if (options.periodStart) {
      where.periodStart = { gte: options.periodStart };
    }
    if (options.periodEnd) {
      where.periodEnd = { lte: options.periodEnd };
    }

    const [data, total] = await Promise.all([
      this.prisma.ownerPayout.findMany({
        where,
        include: {
          owner: { select: { name: true } },
          lineItems: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ownerPayout.count({ where }),
    ]);

    return {
      data: data.map((p) => this.toPayoutView(p)),
      total,
      page,
      limit,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a unique payout number.
   * Format: PAY-OUT-{YYYYMM}-{SEQUENCE}
   */
  private async generatePayoutNumber(partnerId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PAY-OUT-${yearMonth}`;

    const count = await this.prisma.ownerPayout.count({
      where: {
        partnerId,
        payoutNumber: { startsWith: prefix },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${sequence}`;
  }

  /**
   * Convert a Prisma payout (with relations) to a PayoutView.
   */
  private toPayoutView(payout: any): PayoutView {
    return {
      id: payout.id,
      ownerId: payout.ownerId,
      ownerName: payout.owner?.name || '',
      payoutNumber: payout.payoutNumber,
      periodStart: payout.periodStart,
      periodEnd: payout.periodEnd,
      status: payout.status,
      grossRental: Number(payout.grossRental),
      platformFee: Number(payout.platformFee),
      maintenanceCost: Number(payout.maintenanceCost),
      otherDeductions: Number(payout.otherDeductions),
      netPayout: Number(payout.netPayout),
      bankName: payout.bankName,
      bankAccount: payout.bankAccount,
      bankAccountName: payout.bankAccountName,
      approvedBy: payout.approvedBy,
      approvedAt: payout.approvedAt,
      processedAt: payout.processedAt,
      bankReference: payout.bankReference,
      lineItems: (payout.lineItems || []).map((li: any) => ({
        id: li.id,
        tenancyId: li.tenancyId,
        billingId: li.billingId,
        type: li.type,
        description: li.description,
        amount: Number(li.amount),
      })),
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt,
    };
  }

  /**
   * Generate a PDF payout statement using PDFKit.
   */
  private async generatePdfFromPayout(payout: PayoutView): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const formatCurrency = (amount: number): string =>
          `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const formatDate = (date: Date | null): string =>
          date ? new Date(date).toLocaleDateString('en-MY') : '-';

        // ── Header ──────────────────────────────────────────────────────
        doc.fontSize(20).text('PAYOUT STATEMENT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666666').text(`Payout No: ${payout.payoutNumber}`, { align: 'center' });
        doc.moveDown(2);

        // ── Payout Details ──────────────────────────────────────────────
        doc.fillColor('#000000').fontSize(12).text('Payout Details', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Payout Number: ${payout.payoutNumber}`);
        doc.text(`Owner: ${payout.ownerName}`);
        doc.text(`Period: ${formatDate(payout.periodStart)} to ${formatDate(payout.periodEnd)}`);
        doc.text(`Status: ${payout.status}`);
        if (payout.approvedAt) {
          doc.text(`Approved: ${formatDate(payout.approvedAt)}`);
        }
        if (payout.processedAt) {
          doc.text(`Processed: ${formatDate(payout.processedAt)}`);
        }
        if (payout.bankReference) {
          doc.text(`Bank Reference: ${payout.bankReference}`);
        }
        doc.moveDown(1.5);

        // ── Bank Details ────────────────────────────────────────────────
        if (payout.bankName || payout.bankAccount) {
          doc.fontSize(12).text('Bank Details', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);
          if (payout.bankName) doc.text(`Bank: ${payout.bankName}`);
          if (payout.bankAccount) doc.text(`Account: ${payout.bankAccount}`);
          if (payout.bankAccountName) doc.text(`Account Holder: ${payout.bankAccountName}`);
          doc.moveDown(1.5);
        }

        // ── Line Items Table ────────────────────────────────────────────
        doc.fontSize(12).text('Line Items', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colDescription = 50;
        const colType = 330;
        const colAmount = 460;

        doc.fontSize(9).fillColor('#666666');
        doc.text('Description', colDescription, tableTop);
        doc.text('Type', colType, tableTop);
        doc.text('Amount', colAmount, tableTop);

        doc.moveTo(colDescription, tableTop + 15).lineTo(545, tableTop + 15).stroke('#cccccc');

        let yPos = tableTop + 22;

        for (const li of payout.lineItems) {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          doc.fillColor('#000000').fontSize(9);
          doc.text(li.description, colDescription, yPos, { width: 270 });
          doc.text(li.type, colType, yPos);
          const amountColor = li.amount < 0 ? '#cc0000' : '#000000';
          doc.fillColor(amountColor).text(formatCurrency(li.amount), colAmount, yPos);
          yPos += 18;
        }

        // Separator line
        doc.moveTo(colDescription, yPos + 5).lineTo(545, yPos + 5).stroke('#cccccc');
        yPos += 15;

        // ── Summary ─────────────────────────────────────────────────────
        doc.fillColor('#000000').fontSize(10);
        doc.text('Gross Rental:', 330, yPos);
        doc.text(formatCurrency(payout.grossRental), colAmount, yPos);
        yPos += 16;

        doc.fillColor('#cc0000');
        doc.text('Platform Fee:', 330, yPos);
        doc.text(`-${formatCurrency(payout.platformFee)}`, colAmount, yPos);
        yPos += 16;

        if (payout.maintenanceCost > 0) {
          doc.text('Maintenance Cost:', 330, yPos);
          doc.text(`-${formatCurrency(payout.maintenanceCost)}`, colAmount, yPos);
          yPos += 16;
        }

        if (payout.otherDeductions > 0) {
          doc.text('Other Deductions:', 330, yPos);
          doc.text(`-${formatCurrency(payout.otherDeductions)}`, colAmount, yPos);
          yPos += 16;
        }

        // Net payout (bold line)
        doc.moveTo(330, yPos + 2).lineTo(545, yPos + 2).stroke('#000000');
        yPos += 10;

        doc.fillColor('#000000').fontSize(12);
        doc.text('Net Payout:', 330, yPos);
        doc.text(formatCurrency(payout.netPayout), colAmount, yPos);

        // ── Footer ──────────────────────────────────────────────────────
        doc.fontSize(8).fillColor('#999999');
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-MY')} | Currency: MYR (Malaysian Ringgit)`,
          50,
          750,
          { align: 'center' },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
