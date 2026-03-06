import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RentPayment,
  RentPaymentStatus,
  RentBillingStatus,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as PDFDocument from 'pdfkit';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';
import { StripeBillingProvider } from '@infrastructure/billing/providers/stripe-billing.provider';

import {
  CreatePaymentIntentDto,
  RecordManualPaymentDto,
  PaymentQueryDto,
  PaymentMethod,
} from './dto';

// ─────────────────────────────────────────────────────────────────────────────
// View Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentView extends RentPayment {
  billing?: {
    id: string;
    billNumber: string;
    billingPeriod: Date;
    totalAmount: Decimal;
    balanceDue: Decimal;
    status: RentBillingStatus;
    tenancy?: {
      id: string;
      listing: { id: string; title: string };
      owner: { id: string; name: string };
      tenant: { id: string; user: { fullName: string; email: string } };
    };
  };
}

export interface PaymentListResult {
  data: PaymentView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Billable statuses (can accept payments)
// ─────────────────────────────────────────────────────────────────────────────

const PAYABLE_STATUSES: RentBillingStatus[] = [
  RentBillingStatus.GENERATED,
  RentBillingStatus.SENT,
  RentBillingStatus.PARTIALLY_PAID,
  RentBillingStatus.OVERDUE,
];

/**
 * FPX-supported bank codes for Malaysia
 */
export const FPX_BANKS = [
  'affin_bank', 'alliance_bank', 'ambank', 'bank_islam', 'bank_muamalat',
  'bank_rakyat', 'bsn', 'cimb', 'hong_leong_bank', 'hsbc', 'maybank2u',
  'ocbc', 'public_bank', 'rhb', 'standard_chartered', 'uob',
] as const;

@Injectable()
export class RentPaymentService {
  private readonly logger = new Logger(RentPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly stripeBilling: StripeBillingProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Create Payment Intent (Stripe / FPX)
  // ─────────────────────────────────────────────────────────────────────────

  async createPaymentIntent(dto: CreatePaymentIntentDto): Promise<PaymentView> {
    const partnerId = this.PartnerContext.partnerId;

    // Validate billing exists and is payable
    const billing = await this.prisma.rentBilling.findFirst({
      where: { id: dto.billingId },
      include: {
        tenancy: {
          include: {
            listing: { select: { id: true, title: true } },
            owner: { select: { id: true, name: true } },
            tenant: {
              include: { user: { select: { fullName: true, email: true } } },
            },
          },
        },
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${dto.billingId} not found`);
    }

    if (!PAYABLE_STATUSES.includes(billing.status)) {
      throw new BadRequestException(
        `Billing is in ${billing.status} status. Payments can only be made for: ${PAYABLE_STATUSES.join(', ')}`,
      );
    }

    // Validate amount doesn't exceed balance due
    const balanceDue = Number(billing.balanceDue);
    if (dto.amount > balanceDue) {
      throw new BadRequestException(
        `Payment amount ${dto.amount} exceeds balance due ${balanceDue}`,
      );
    }

    // Determine payment method types based on method
    const method = dto.method || PaymentMethod.CARD;
    const currency = dto.currency || 'MYR';

    // Create Stripe PaymentIntent with FPX support
    const metadata: Record<string, string> = {
      partnerId,
      billingId: dto.billingId,
      tenancyId: billing.tenancyId,
      billNumber: billing.billNumber,
      paymentType: 'rent',
      method,
    };

    const stripeIntent = await this.stripeBilling.createPaymentIntent({
      amount: dto.amount,
      currency,
      metadata,
    });

    // Generate payment number
    const paymentNumber = await this.generatePaymentNumber();

    // Create payment record
    const payment = await this.prisma.rentPayment.create({
      data: {
        partnerId,
        billingId: dto.billingId,
        paymentNumber,
        amount: dto.amount,
        status: RentPaymentStatus.PENDING,
        method,
        currency,
        gatewayId: stripeIntent.id,
        clientSecret: stripeIntent.clientSecret,
        gatewayData: stripeIntent as unknown as Prisma.JsonObject,
        payerName: billing.tenancy?.tenant?.user?.fullName,
        payerEmail: billing.tenancy?.tenant?.user?.email,
      },
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

    this.logger.log(
      `Payment intent created: ${paymentNumber} for bill ${billing.billNumber}, amount: ${dto.amount} ${currency}`,
    );

    return payment as PaymentView;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Record Manual Payment (bank transfer, cash)
  // ─────────────────────────────────────────────────────────────────────────

  async recordManualPayment(dto: RecordManualPaymentDto): Promise<PaymentView> {
    const partnerId = this.PartnerContext.partnerId;

    // Validate billing
    const billing = await this.prisma.rentBilling.findFirst({
      where: { id: dto.billingId },
      include: {
        tenancy: {
          include: {
            listing: { select: { id: true, title: true } },
            owner: { select: { id: true, name: true } },
            tenant: {
              include: { user: { select: { fullName: true, email: true } } },
            },
          },
        },
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${dto.billingId} not found`);
    }

    if (!PAYABLE_STATUSES.includes(billing.status)) {
      throw new BadRequestException(
        `Billing is in ${billing.status} status. Payments can only be made for: ${PAYABLE_STATUSES.join(', ')}`,
      );
    }

    const balanceDue = Number(billing.balanceDue);
    if (dto.amount > balanceDue) {
      throw new BadRequestException(
        `Payment amount ${dto.amount} exceeds balance due ${balanceDue}`,
      );
    }

    const paymentNumber = await this.generatePaymentNumber();
    const receiptNumber = await this.generateReceiptNumber();
    const now = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    // Create payment and update billing in transaction
    const payment = await this.prisma.$transaction(async (tx) => {
      // Create the payment as COMPLETED immediately
      const newPayment = await tx.rentPayment.create({
        data: {
          partnerId,
          billingId: dto.billingId,
          paymentNumber,
          amount: dto.amount,
          status: RentPaymentStatus.COMPLETED,
          method: dto.method,
          currency: 'MYR',
          reference: dto.reference,
          receiptNumber,
          paymentDate: now,
          processedAt: now,
          payerName: dto.payerName || billing.tenancy?.tenant?.user?.fullName,
          payerEmail: dto.payerEmail || billing.tenancy?.tenant?.user?.email,
        },
      });

      // Update billing amounts
      await this.updateBillingOnPayment(tx, billing.id, dto.amount);

      return newPayment;
    });

    // Emit payment event
    this.eventEmitter.emit('rent.payment.completed', {
      partnerId,
      paymentId: payment.id,
      billingId: billing.id,
      billNumber: billing.billNumber,
      paymentNumber: payment.paymentNumber,
      amount: dto.amount,
      method: dto.method,
      receiptNumber,
      tenantUserId: billing.tenancy?.tenant?.user ? undefined : undefined,
      tenantName: billing.tenancy?.tenant?.user?.fullName,
      tenantEmail: billing.tenancy?.tenant?.user?.email,
      propertyTitle: billing.tenancy?.listing?.title,
    });

    this.logger.log(
      `Manual payment recorded: ${paymentNumber} for bill ${billing.billNumber}, amount: ${dto.amount}`,
    );

    // Re-fetch with relations
    return this.getPayment(payment.id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Process Webhook (Stripe payment_intent.succeeded)
  // ─────────────────────────────────────────────────────────────────────────

  async handlePaymentSuccess(
    gatewayId: string,
    amount: number,
    metadata: Record<string, string>,
  ): Promise<void> {
    // Find the payment by gatewayId
    const payment = await this.prisma.rentPayment.findFirst({
      where: { gatewayId },
      include: {
        billing: {
          include: {
            tenancy: {
              include: {
                listing: { select: { id: true, title: true } },
                tenant: {
                  include: { user: { select: { fullName: true, email: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`No rent payment found for gateway ID: ${gatewayId}`);
      return;
    }

    if (payment.status === RentPaymentStatus.COMPLETED) {
      this.logger.debug(`Payment ${payment.paymentNumber} already completed, skipping`);
      return;
    }

    const receiptNumber = await this.generateReceiptNumber();
    const now = new Date();

    // Update payment and billing in transaction
    await this.prisma.$transaction(async (tx) => {
      // Mark payment as completed
      await tx.rentPayment.update({
        where: { id: payment.id },
        data: {
          status: RentPaymentStatus.COMPLETED,
          receiptNumber,
          paymentDate: now,
          processedAt: now,
        },
      });

      // Update billing amounts
      await this.updateBillingOnPayment(tx, payment.billingId, Number(payment.amount));
    });

    // Emit payment completed event
    this.eventEmitter.emit('rent.payment.completed', {
      partnerId: payment.partnerId,
      paymentId: payment.id,
      billingId: payment.billingId,
      billNumber: payment.billing?.billNumber,
      paymentNumber: payment.paymentNumber,
      amount: Number(payment.amount),
      method: payment.method,
      receiptNumber,
      tenantName: payment.billing?.tenancy?.tenant?.user?.fullName,
      tenantEmail: payment.billing?.tenancy?.tenant?.user?.email,
      propertyTitle: payment.billing?.tenancy?.listing?.title,
    });

    this.logger.log(
      `Payment completed via webhook: ${payment.paymentNumber}, amount: ${payment.amount}`,
    );
  }

  /**
   * Handle failed payment from Stripe webhook
   */
  async handlePaymentFailure(
    gatewayId: string,
    errorMessage?: string,
  ): Promise<void> {
    const payment = await this.prisma.rentPayment.findFirst({
      where: { gatewayId },
    });

    if (!payment) {
      this.logger.warn(`No rent payment found for gateway ID: ${gatewayId}`);
      return;
    }

    if (payment.status !== RentPaymentStatus.PENDING && payment.status !== RentPaymentStatus.PROCESSING) {
      this.logger.debug(`Payment ${payment.paymentNumber} not in pending/processing state, skipping`);
      return;
    }

    await this.prisma.rentPayment.update({
      where: { id: payment.id },
      data: {
        status: RentPaymentStatus.FAILED,
        gatewayData: {
          ...(payment.gatewayData as object || {}),
          failureReason: errorMessage,
        },
      },
    });

    this.eventEmitter.emit('rent.payment.failed', {
      partnerId: payment.partnerId,
      paymentId: payment.id,
      billingId: payment.billingId,
      paymentNumber: payment.paymentNumber,
      amount: Number(payment.amount),
      error: errorMessage,
    });

    this.logger.warn(
      `Payment failed: ${payment.paymentNumber}, reason: ${errorMessage}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Get Payment
  // ─────────────────────────────────────────────────────────────────────────

  async getPayment(id: string): Promise<PaymentView> {
    const payment = await this.prisma.rentPayment.findFirst({
      where: { id },
      include: {
        billing: {
          select: {
            id: true,
            billNumber: true,
            billingPeriod: true,
            totalAmount: true,
            balanceDue: true,
            status: true,
            tenancy: {
              select: {
                id: true,
                listing: { select: { id: true, title: true } },
                owner: { select: { id: true, name: true } },
                tenant: {
                  select: { id: true, user: { select: { fullName: true, email: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    return payment as PaymentView;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // List Payments
  // ─────────────────────────────────────────────────────────────────────────

  async listPayments(query: PaymentQueryDto): Promise<PaymentListResult> {
    const partnerId = this.PartnerContext.partnerId;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RentPaymentWhereInput = {
      partnerId,
    };

    if (query.billingId) {
      where.billingId = query.billingId;
    }

    if (query.status) {
      where.status = query.status as RentPaymentStatus;
    }

    if (query.method) {
      where.method = query.method;
    }

    const [data, total] = await Promise.all([
      this.prisma.rentPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.rentPayment.count({ where }),
    ]);

    return {
      data: data as PaymentView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Receipt PDF
  // ─────────────────────────────────────────────────────────────────────────

  async generateReceipt(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const payment = await this.prisma.rentPayment.findFirst({
      where: { id },
      include: {
        billing: {
          include: {
            tenancy: {
              include: {
                listing: { select: { id: true, title: true } },
                owner: { select: { id: true, name: true, email: true } },
                tenant: {
                  include: { user: { select: { fullName: true, email: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    if (payment.status !== RentPaymentStatus.COMPLETED) {
      throw new BadRequestException('Receipt can only be generated for completed payments');
    }

    const buffer = await this.buildReceiptPdf(payment);
    const filename = `${payment.receiptNumber || payment.paymentNumber}.pdf`;

    return { buffer, filename };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FPX Bank List
  // ─────────────────────────────────────────────────────────────────────────

  getFpxBanks(): { code: string; name: string }[] {
    const bankNames: Record<string, string> = {
      affin_bank: 'Affin Bank',
      alliance_bank: 'Alliance Bank',
      ambank: 'AmBank',
      bank_islam: 'Bank Islam',
      bank_muamalat: 'Bank Muamalat',
      bank_rakyat: 'Bank Rakyat',
      bsn: 'Bank Simpanan Nasional',
      cimb: 'CIMB Bank',
      hong_leong_bank: 'Hong Leong Bank',
      hsbc: 'HSBC Bank',
      maybank2u: 'Maybank',
      ocbc: 'OCBC Bank',
      public_bank: 'Public Bank',
      rhb: 'RHB Bank',
      standard_chartered: 'Standard Chartered',
      uob: 'UOB Bank',
    };

    return FPX_BANKS.map((code) => ({
      code,
      name: bankNames[code] || code,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Update billing paidAmount/balanceDue/status when a payment is received
   */
  private async updateBillingOnPayment(
    tx: Prisma.TransactionClient,
    billingId: string,
    paymentAmount: number,
  ): Promise<void> {
    const billing = await tx.rentBilling.findFirst({
      where: { id: billingId },
    });

    if (!billing) return;

    const newPaidAmount = Number(billing.paidAmount) + paymentAmount;
    const newBalanceDue = Number(billing.totalAmount) - newPaidAmount;

    // Determine new status
    let newStatus: RentBillingStatus;
    if (newBalanceDue <= 0) {
      newStatus = RentBillingStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = RentBillingStatus.PARTIALLY_PAID;
    } else {
      newStatus = billing.status; // No change
    }

    const updateData: Prisma.RentBillingUpdateInput = {
      paidAmount: Math.max(0, newPaidAmount),
      balanceDue: Math.max(0, newBalanceDue),
      status: newStatus,
    };

    if (newStatus === RentBillingStatus.PAID) {
      updateData.paidDate = new Date();
    }

    await tx.rentBilling.update({
      where: { id: billingId },
      data: updateData,
    });

    // Emit billing status change event
    if (newStatus !== billing.status) {
      this.eventEmitter.emit('billing.status.changed', {
        billingId,
        billNumber: billing.billNumber,
        previousStatus: billing.status,
        newStatus,
        paidAmount: newPaidAmount,
        balanceDue: Math.max(0, newBalanceDue),
      });
    }
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
      const lastSequence = parseInt(lastPayment.paymentNumber.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
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
      const lastSequence = parseInt(lastPayment.receiptNumber!.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Build receipt PDF using PDFKit
   */
  private async buildReceiptPdf(payment: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Payment Receipt - ${payment.receiptNumber || payment.paymentNumber}`,
            Author: 'Zam Property',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const tenancy = payment.billing?.tenancy;
        const tenantName = tenancy?.tenant?.user?.fullName || 'N/A';
        const ownerName = tenancy?.owner?.name || 'N/A';
        const propertyTitle = tenancy?.listing?.title || 'N/A';

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text('Zam Property Management', { align: 'center' });
        doc.moveDown(1);

        // Receipt info
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text(`Receipt Number: ${payment.receiptNumber || payment.paymentNumber}`);
        doc.font('Helvetica');
        doc.text(`Payment Number: ${payment.paymentNumber}`);
        doc.text(`Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-MY') : 'N/A'}`);
        doc.text(`Bill Number: ${payment.billing?.billNumber || 'N/A'}`);
        doc.moveDown(1);

        // Horizontal line
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Property & parties
        doc.fontSize(11).font('Helvetica-Bold').text('Property Details');
        doc.font('Helvetica');
        doc.text(`Property: ${propertyTitle}`);
        doc.text(`Owner: ${ownerName}`);
        doc.text(`Tenant: ${tenantName}`);
        doc.moveDown(1);

        // Payment details
        doc.font('Helvetica-Bold').text('Payment Details');
        doc.font('Helvetica');
        doc.text(`Amount: RM ${Number(payment.amount).toFixed(2)}`);
        doc.text(`Method: ${payment.method}`);
        doc.text(`Currency: ${payment.currency}`);
        if (payment.reference) {
          doc.text(`Reference: ${payment.reference}`);
        }
        doc.text(`Status: ${payment.status}`);
        doc.moveDown(1);

        // Bill information
        if (payment.billing) {
          doc.font('Helvetica-Bold').text('Bill Information');
          doc.font('Helvetica');
          doc.text(`Total Amount: RM ${Number(payment.billing.totalAmount).toFixed(2)}`);
          doc.text(`Balance Due: RM ${Number(payment.billing.balanceDue).toFixed(2)}`);
          doc.text(`Bill Status: ${payment.billing.status}`);
        }

        doc.moveDown(2);

        // Footer
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).text('This is a computer-generated receipt. No signature is required.', {
          align: 'center',
        });
        doc.text(`Generated on ${new Date().toLocaleDateString('en-MY')} at ${new Date().toLocaleTimeString('en-MY')}`, {
          align: 'center',
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
