import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RentBilling,
  RentBillingStatus,
  RentBillingLineItem,
  TenancyStatus,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as PDFDocument from 'pdfkit';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';

import {
  GenerateBillDto,
  AddLineItemDto,
  ApplyLateFeeDto,
  BillingQueryDto,
  LINE_ITEM_TYPES,
} from './dto';

/**
 * View type for billing with relations
 */
export interface BillingView extends RentBilling {
  lineItems?: RentBillingLineItem[];
  tenancy?: {
    id: string;
    status: TenancyStatus;
    monthlyRent: Decimal;
    billingDay: number;
    paymentDueDay: number;
    lateFeePercent: Decimal | null;
    listing: {
      id: string;
      title: string;
    };
    owner: {
      id: string;
      name: string;
      email: string | null;
    };
    tenant: {
      id: string;
      user: {
        fullName: string;
        email: string;
      };
    };
  };
}

/**
 * Paginated result for billing list
 */
export interface BillingListResult {
  data: BillingView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────

export class BillGeneratedEvent {
  constructor(
    public readonly billingId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly billNumber: string,
    public readonly totalAmount: number,
  ) {}
}

export class BillOverdueEvent {
  constructor(
    public readonly billingId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly billNumber: string,
    public readonly balanceDue: number,
    public readonly dueDate: Date,
  ) {}
}

export class BillPaidEvent {
  constructor(
    public readonly billingId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly billNumber: string,
    public readonly paidAmount: number,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Service for managing rent billing (invoice generation, line items, late fees, PDF)
 */
@Injectable()
export class RentBillingService {
  private readonly logger = new Logger(RentBillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate a bill for a tenancy period.
   * Creates line items for rent + any additional charges.
   */
  async generateBill(dto: GenerateBillDto): Promise<BillingView> {
    const partnerId = this.PartnerContext.partnerId;

    // Verify tenancy exists and belongs to partner
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: dto.tenancyId, partnerId },
      include: {
        listing: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true, email: true } },
        tenant: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${dto.tenancyId} not found`);
    }

    // Verify tenancy is in a billable state
    const billableStatuses: TenancyStatus[] = [
      TenancyStatus.ACTIVE,
      TenancyStatus.MAINTENANCE_HOLD,
      TenancyStatus.INSPECTION_PENDING,
      TenancyStatus.TERMINATION_REQUESTED,
    ];
    if (!billableStatuses.includes(tenancy.status)) {
      throw new BadRequestException(
        `Cannot generate bill for tenancy in ${tenancy.status} status. Must be in: ${billableStatuses.join(', ')}`,
      );
    }

    // Check for duplicate billing period
    const billingPeriod = new Date(dto.billingPeriod);
    billingPeriod.setUTCHours(0, 0, 0, 0);

    const existingBill = await this.prisma.rentBilling.findFirst({
      where: {
        tenancyId: dto.tenancyId,
        billingPeriod,
      },
    });

    if (existingBill) {
      throw new ConflictException(
        `Bill already exists for tenancy ${dto.tenancyId} for period ${billingPeriod.toISOString().slice(0, 7)}. Bill number: ${existingBill.billNumber}`,
      );
    }

    // Generate bill number
    const billNumber = await this.generateBillNumber(partnerId);

    // Calculate amounts
    const rentAmount = Number(tenancy.monthlyRent);
    let lateFee = 0;

    // Check for late fees from previous overdue bills
    if (dto.includeLateFee !== false) {
      lateFee = await this.calculateLateFee(dto.tenancyId, tenancy.lateFeePercent);
    }

    // Build line items
    const lineItems: { description: string; type: string; amount: number; claimId?: string }[] = [
      {
        description: `Monthly rent for ${billingPeriod.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}`,
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

    // Add additional line items from DTO
    if (dto.additionalLineItems?.length) {
      for (const item of dto.additionalLineItems) {
        lineItems.push({
          description: item.description,
          type: item.type,
          amount: item.amount,
          claimId: item.claimId,
        });
      }
    }

    // Calculate totals
    const adjustments = lineItems
      .filter((li) => li.type !== 'RENT' && li.type !== 'LATE_FEE')
      .reduce((sum, li) => sum + li.amount, 0);
    const totalAmount = rentAmount + lateFee + adjustments;
    const balanceDue = totalAmount; // No payments yet

    // Issue date
    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();

    // Due date: billingDay + paymentDueDay days
    const dueDate = new Date(billingPeriod);
    dueDate.setUTCDate(tenancy.billingDay + tenancy.paymentDueDay);

    // Create bill with line items in a transaction
    const billing = await this.prisma.$transaction(async (tx) => {
      const bill = await tx.rentBilling.create({
        data: {
          tenancyId: dto.tenancyId,
          billNumber,
          billingPeriod,
          status: RentBillingStatus.GENERATED,
          rentAmount,
          lateFee,
          adjustments,
          totalAmount,
          paidAmount: 0,
          balanceDue,
          issueDate,
          dueDate,
          lineItems: {
            create: lineItems.map((li) => ({
              description: li.description,
              type: li.type,
              amount: li.amount,
              claimId: li.claimId || null,
            })),
          },
        },
        include: {
          lineItems: true,
        },
      });

      return bill;
    });

    this.logger.log(
      `Generated bill ${billNumber} for tenancy ${dto.tenancyId}, period ${billingPeriod.toISOString().slice(0, 7)}, total: ${totalAmount}`,
    );

    // Emit event
    this.eventEmitter.emit(
      'billing.generated',
      new BillGeneratedEvent(billing.id, dto.tenancyId, partnerId, billNumber, totalAmount),
    );

    // Return with tenancy relations
    return {
      ...billing,
      tenancy: {
        id: tenancy.id,
        status: tenancy.status,
        monthlyRent: tenancy.monthlyRent,
        billingDay: tenancy.billingDay,
        paymentDueDay: tenancy.paymentDueDay,
        lateFeePercent: tenancy.lateFeePercent,
        listing: tenancy.listing,
        owner: tenancy.owner,
        tenant: tenancy.tenant,
      },
    } as BillingView;
  }

  /**
   * Calculate late fee based on overdue bills for a tenancy.
   */
  async calculateLateFee(
    tenancyId: string,
    lateFeePercent: Decimal | null,
  ): Promise<number> {
    if (!lateFeePercent || Number(lateFeePercent) === 0) {
      return 0;
    }

    // Find overdue bills with outstanding balance
    const overdueBills = await this.prisma.rentBilling.findMany({
      where: {
        tenancyId,
        status: { in: [RentBillingStatus.OVERDUE, RentBillingStatus.SENT, RentBillingStatus.GENERATED] },
        dueDate: { lt: new Date() },
        balanceDue: { gt: 0 },
      },
    });

    if (overdueBills.length === 0) {
      return 0;
    }

    const totalOverdue = overdueBills.reduce((sum, bill) => sum + Number(bill.balanceDue), 0);
    const feePercent = Number(lateFeePercent) / 100;
    const lateFee = Math.round(totalOverdue * feePercent * 100) / 100;

    this.logger.debug(
      `Late fee calculated: ${lateFee} (${lateFeePercent}% of ${totalOverdue} overdue across ${overdueBills.length} bills)`,
    );

    return lateFee;
  }

  /**
   * Add a line item to an existing bill.
   * Only allowed for DRAFT or GENERATED bills.
   */
  async addLineItem(billingId: string, dto: AddLineItemDto): Promise<BillingView> {
    const partnerId = this.PartnerContext.partnerId;

    const billing = await this.findById(billingId);

    // Verify bill belongs to partner
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: billing.tenancyId, partnerId },
    });

    if (!tenancy) {
      throw new NotFoundException(`Billing ${billingId} not found`);
    }

    // Only allow adding items to editable bills
    const editableStatuses: RentBillingStatus[] = [
      RentBillingStatus.DRAFT,
      RentBillingStatus.GENERATED,
      RentBillingStatus.SENT,
      RentBillingStatus.OVERDUE,
    ];
    if (!editableStatuses.includes(billing.status)) {
      throw new BadRequestException(
        `Cannot add line item to bill in ${billing.status} status. Must be in: ${editableStatuses.join(', ')}`,
      );
    }

    // Create line item and update totals
    const updatedBilling = await this.prisma.$transaction(async (tx) => {
      // Create the line item
      await tx.rentBillingLineItem.create({
        data: {
          billingId,
          description: dto.description,
          type: dto.type,
          amount: dto.amount,
          claimId: dto.claimId || null,
        },
      });

      // Recalculate totals
      const allItems = await tx.rentBillingLineItem.findMany({
        where: { billingId },
      });

      const rentTotal = allItems
        .filter((li) => li.type === 'RENT')
        .reduce((sum, li) => sum + Number(li.amount), 0);
      const lateFeeTotal = allItems
        .filter((li) => li.type === 'LATE_FEE')
        .reduce((sum, li) => sum + Number(li.amount), 0);
      const adjustments = allItems
        .filter((li) => li.type !== 'RENT' && li.type !== 'LATE_FEE')
        .reduce((sum, li) => sum + Number(li.amount), 0);
      const totalAmount = rentTotal + lateFeeTotal + adjustments;
      const balanceDue = totalAmount - Number(billing.paidAmount);

      return tx.rentBilling.update({
        where: { id: billingId },
        data: {
          rentAmount: rentTotal,
          lateFee: lateFeeTotal,
          adjustments,
          totalAmount,
          balanceDue,
        },
        include: { lineItems: true },
      });
    });

    this.logger.log(`Added line item to bill ${billingId}: ${dto.type} - ${dto.amount}`);

    return updatedBilling as BillingView;
  }

  /**
   * Apply late fee to a specific bill.
   */
  async applyLateFee(billingId: string, dto: ApplyLateFeeDto): Promise<BillingView> {
    const partnerId = this.PartnerContext.partnerId;

    const billing = await this.findById(billingId);

    // Verify ownership
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: billing.tenancyId, partnerId },
    });

    if (!tenancy) {
      throw new NotFoundException(`Billing ${billingId} not found`);
    }

    const editableStatuses: RentBillingStatus[] = [
      RentBillingStatus.DRAFT,
      RentBillingStatus.GENERATED,
      RentBillingStatus.SENT,
      RentBillingStatus.OVERDUE,
    ];
    if (!editableStatuses.includes(billing.status)) {
      throw new BadRequestException(
        `Cannot apply late fee to bill in ${billing.status} status`,
      );
    }

    const feePercent = dto.lateFeePercent ?? Number(tenancy.lateFeePercent ?? 0);
    if (feePercent <= 0) {
      throw new BadRequestException('Late fee percentage must be greater than 0');
    }

    const lateFeeAmount = Math.round(Number(billing.rentAmount) * (feePercent / 100) * 100) / 100;

    return this.addLineItem(billingId, {
      description: `Late fee (${feePercent}% of rent)`,
      type: 'LATE_FEE',
      amount: lateFeeAmount,
    });
  }

  /**
   * Get a single bill by ID with all relations.
   */
  async getBill(id: string): Promise<BillingView> {
    const partnerId = this.PartnerContext.partnerId;

    const billing = await this.prisma.rentBilling.findFirst({
      where: {
        id,
        tenancy: { partnerId },
      },
      include: {
        lineItems: {
          orderBy: { createdAt: 'asc' },
        },
        reminders: {
          orderBy: { sequence: 'asc' },
        },
        tenancy: {
          select: {
            id: true,
            status: true,
            monthlyRent: true,
            billingDay: true,
            paymentDueDay: true,
            lateFeePercent: true,
            listing: { select: { id: true, title: true } },
            owner: { select: { id: true, name: true, email: true } },
            tenant: {
              select: {
                id: true,
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${id} not found`);
    }

    return billing as BillingView;
  }

  /**
   * List bills with filtering and pagination.
   */
  async listBills(query: BillingQueryDto): Promise<BillingListResult> {
    const partnerId = this.PartnerContext.partnerId;
    const page = query.page || 1;
    const limit = query.pageSize || 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Build where clause
    const where: Prisma.RentBillingWhereInput = {
      tenancy: { partnerId },
    };

    if (query.tenancyId) {
      where.tenancyId = query.tenancyId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.billingPeriod) {
      where.billingPeriod = new Date(query.billingPeriod);
    }

    if (query.fromDate || query.toDate) {
      where.issueDate = {};
      if (query.fromDate) {
        where.issueDate.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.issueDate.lte = new Date(query.toDate);
      }
    }

    if (query.ownerId) {
      where.tenancy = {
        ...((where.tenancy as Prisma.TenancyWhereInput) || {}),
        ownerId: query.ownerId,
      };
    }

    if (query.tenantId) {
      where.tenancy = {
        ...((where.tenancy as Prisma.TenancyWhereInput) || {}),
        tenantId: query.tenantId,
      };
    }

    if (query.overdueOnly === 'true') {
      where.status = RentBillingStatus.OVERDUE;
    }

    const [data, total] = await Promise.all([
      this.prisma.rentBilling.findMany({
        where,
        include: {
          lineItems: true,
          tenancy: {
            select: {
              id: true,
              status: true,
              monthlyRent: true,
              billingDay: true,
              paymentDueDay: true,
              lateFeePercent: true,
              listing: { select: { id: true, title: true } },
              owner: { select: { id: true, name: true, email: true } },
              tenant: {
                select: {
                  id: true,
                  user: { select: { fullName: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.rentBilling.count({ where }),
    ]);

    return {
      data: data as BillingView[],
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark a bill as sent.
   */
  async markAsSent(id: string): Promise<BillingView> {
    const billing = await this.getBill(id);

    if (billing.status !== RentBillingStatus.GENERATED) {
      throw new BadRequestException(
        `Cannot mark bill as sent. Current status: ${billing.status}. Must be GENERATED.`,
      );
    }

    const updated = await this.prisma.rentBilling.update({
      where: { id },
      data: { status: RentBillingStatus.SENT },
      include: { lineItems: true },
    });

    this.logger.log(`Bill ${billing.billNumber} marked as SENT`);

    return updated as BillingView;
  }

  /**
   * Mark a bill as overdue.
   */
  async markAsOverdue(id: string): Promise<BillingView> {
    const billing = await this.getBill(id);

    const overdueableStatuses: RentBillingStatus[] = [
      RentBillingStatus.GENERATED,
      RentBillingStatus.SENT,
      RentBillingStatus.PARTIALLY_PAID,
    ];
    if (!overdueableStatuses.includes(billing.status)) {
      throw new BadRequestException(
        `Cannot mark bill as overdue. Current status: ${billing.status}`,
      );
    }

    const updated = await this.prisma.rentBilling.update({
      where: { id },
      data: { status: RentBillingStatus.OVERDUE },
      include: { lineItems: true },
    });

    this.logger.log(`Bill ${billing.billNumber} marked as OVERDUE`);

    // Emit event
    this.eventEmitter.emit(
      'billing.overdue',
      new BillOverdueEvent(
        id,
        billing.tenancyId,
        this.PartnerContext.partnerId,
        billing.billNumber,
        Number(billing.balanceDue),
        billing.dueDate,
      ),
    );

    return updated as BillingView;
  }

  /**
   * Write off a bill (mark as uncollectable).
   */
  async writeOff(id: string): Promise<BillingView> {
    const billing = await this.getBill(id);

    if (billing.status === RentBillingStatus.PAID || billing.status === RentBillingStatus.WRITTEN_OFF) {
      throw new BadRequestException(
        `Cannot write off bill in ${billing.status} status`,
      );
    }

    const updated = await this.prisma.rentBilling.update({
      where: { id },
      data: { status: RentBillingStatus.WRITTEN_OFF },
      include: { lineItems: true },
    });

    this.logger.log(`Bill ${billing.billNumber} written off`);

    return updated as BillingView;
  }

  /**
   * Generate a PDF for a billing statement.
   * Returns a Buffer containing the PDF data.
   */
  async generateBillPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const billing = await this.getBill(id);

    const tenancy = billing.tenancy;
    if (!tenancy) {
      throw new BadRequestException('Billing has no tenancy data');
    }

    const buffer = await this.generatePdfFromBilling(billing);
    const filename = `${billing.billNumber}.pdf`;

    this.logger.log(`Generated PDF for bill ${billing.billNumber}`);

    return { buffer, filename };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Billing Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get billing configuration for a tenancy.
   */
  async getBillingConfig(tenancyId: string): Promise<{
    tenancyId: string;
    billingDay: number;
    paymentDueDay: number;
    lateFeePercent: number | null;
    monthlyRent: number;
  }> {
    const partnerId = this.PartnerContext.partnerId;

    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId, partnerId },
      select: {
        id: true,
        billingDay: true,
        paymentDueDay: true,
        lateFeePercent: true,
        monthlyRent: true,
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${tenancyId} not found`);
    }

    return {
      tenancyId: tenancy.id,
      billingDay: tenancy.billingDay,
      paymentDueDay: tenancy.paymentDueDay,
      lateFeePercent: tenancy.lateFeePercent ? Number(tenancy.lateFeePercent) : null,
      monthlyRent: Number(tenancy.monthlyRent),
    };
  }

  /**
   * Update billing configuration for a tenancy.
   * Allows changing billing day, payment due days, and late fee percentage.
   */
  async updateBillingConfig(
    tenancyId: string,
    config: {
      billingDay?: number;
      paymentDueDay?: number;
      lateFeePercent?: number | null;
    },
  ): Promise<{
    tenancyId: string;
    billingDay: number;
    paymentDueDay: number;
    lateFeePercent: number | null;
    monthlyRent: number;
  }> {
    const partnerId = this.PartnerContext.partnerId;

    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId, partnerId },
      select: { id: true },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${tenancyId} not found`);
    }

    // Validate billing day (1-28 to avoid month-end issues)
    if (config.billingDay !== undefined) {
      if (config.billingDay < 1 || config.billingDay > 28) {
        throw new BadRequestException('billingDay must be between 1 and 28');
      }
    }

    // Validate payment due day (1-60)
    if (config.paymentDueDay !== undefined) {
      if (config.paymentDueDay < 1 || config.paymentDueDay > 60) {
        throw new BadRequestException('paymentDueDay must be between 1 and 60');
      }
    }

    // Validate late fee percent (0-100)
    if (config.lateFeePercent !== undefined && config.lateFeePercent !== null) {
      if (config.lateFeePercent < 0 || config.lateFeePercent > 100) {
        throw new BadRequestException('lateFeePercent must be between 0 and 100');
      }
    }

    const data: Record<string, unknown> = {};
    if (config.billingDay !== undefined) data.billingDay = config.billingDay;
    if (config.paymentDueDay !== undefined) data.paymentDueDay = config.paymentDueDay;
    if (config.lateFeePercent !== undefined) data.lateFeePercent = config.lateFeePercent;

    const updated = await this.prisma.tenancy.update({
      where: { id: tenancyId },
      data,
      select: {
        id: true,
        billingDay: true,
        paymentDueDay: true,
        lateFeePercent: true,
        monthlyRent: true,
      },
    });

    this.logger.log(`Updated billing config for tenancy ${tenancyId}: ${JSON.stringify(config)}`);

    return {
      tenancyId: updated.id,
      billingDay: updated.billingDay,
      paymentDueDay: updated.paymentDueDay,
      lateFeePercent: updated.lateFeePercent ? Number(updated.lateFeePercent) : null,
      monthlyRent: Number(updated.monthlyRent),
    };
  }

  /**
   * Get billing automation status for a partner.
   * Returns summary of billing activity across all tenancies.
   */
  async getAutomationStatus(): Promise<{
    totalActiveTenancies: number;
    configuredBillingDays: { day: number; count: number }[];
    pendingBills: number;
    overdueBills: number;
    totalOutstanding: number;
    lastBillGenerated: Date | null;
  }> {
    const partnerId = this.PartnerContext.partnerId;

    const [
      activeTenancies,
      billingDayCounts,
      pendingBills,
      overdueBills,
      outstandingResult,
      lastBill,
    ] = await Promise.all([
      // Count active tenancies
      this.prisma.tenancy.count({
        where: {
          partnerId,
          status: { in: ['ACTIVE', 'MAINTENANCE_HOLD', 'INSPECTION_PENDING', 'TERMINATION_REQUESTED'] },
        },
      }),

      // Group by billing day
      this.prisma.tenancy.groupBy({
        by: ['billingDay'],
        where: {
          partnerId,
          status: { in: ['ACTIVE', 'MAINTENANCE_HOLD', 'INSPECTION_PENDING', 'TERMINATION_REQUESTED'] },
        },
        _count: { id: true },
        orderBy: { billingDay: 'asc' },
      }),

      // Count pending (non-paid) bills
      this.prisma.rentBilling.count({
        where: {
          tenancy: { partnerId },
          status: { in: [RentBillingStatus.GENERATED, RentBillingStatus.SENT] },
        },
      }),

      // Count overdue bills
      this.prisma.rentBilling.count({
        where: {
          tenancy: { partnerId },
          status: RentBillingStatus.OVERDUE,
        },
      }),

      // Total outstanding amount
      this.prisma.rentBilling.aggregate({
        where: {
          tenancy: { partnerId },
          status: { in: [RentBillingStatus.GENERATED, RentBillingStatus.SENT, RentBillingStatus.OVERDUE, RentBillingStatus.PARTIALLY_PAID] },
          balanceDue: { gt: 0 },
        },
        _sum: { balanceDue: true },
      }),

      // Last generated bill
      this.prisma.rentBilling.findFirst({
        where: { tenancy: { partnerId } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalActiveTenancies: activeTenancies,
      configuredBillingDays: billingDayCounts.map((g) => ({
        day: g.billingDay,
        count: g._count.id,
      })),
      pendingBills,
      overdueBills,
      totalOutstanding: Number(outstandingResult._sum.balanceDue || 0),
      lastBillGenerated: lastBill?.createdAt || null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Find a bill by ID (internal, no partner check).
   */
  private async findById(id: string): Promise<RentBilling> {
    const billing = await this.prisma.rentBilling.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${id} not found`);
    }

    return billing;
  }

  /**
   * Generate a unique bill number.
   * Format: BILL-{YYYYMM}-{SEQUENCE}
   */
  private async generateBillNumber(partnerId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `BILL-${yearMonth}`;

    // Count existing bills for this month under this partner
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
   * Generate a PDF document from billing data using PDFKit.
   */
  private async generatePdfFromBilling(billing: BillingView): Promise<Buffer> {
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

        const tenancy = billing.tenancy!;
        const formatCurrency = (amount: number | Decimal): string =>
          `RM ${Number(amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Header
        doc.fontSize(20).text('BILLING STATEMENT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666666').text(`Bill No: ${billing.billNumber}`, { align: 'center' });
        doc.moveDown(2);

        // Bill details section
        doc.fillColor('#000000').fontSize(12).text('Bill Details', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Bill Number: ${billing.billNumber}`);
        doc.text(`Billing Period: ${billing.billingPeriod.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}`);
        doc.text(`Issue Date: ${billing.issueDate.toLocaleDateString('en-MY')}`);
        doc.text(`Due Date: ${billing.dueDate.toLocaleDateString('en-MY')}`);
        doc.text(`Status: ${billing.status}`);
        doc.moveDown(1.5);

        // Property details
        doc.fontSize(12).text('Property', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Property: ${tenancy.listing.title}`);
        doc.text(`Owner: ${tenancy.owner.name}`);
        doc.text(`Tenant: ${tenancy.tenant.user.fullName}`);
        doc.moveDown(1.5);

        // Line items table
        doc.fontSize(12).text('Charges', { underline: true });
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        const colDescription = 50;
        const colType = 320;
        const colAmount = 450;

        doc.fontSize(9).fillColor('#666666');
        doc.text('Description', colDescription, tableTop);
        doc.text('Type', colType, tableTop);
        doc.text('Amount', colAmount, tableTop);

        // Header line
        doc.moveTo(colDescription, tableTop + 15).lineTo(545, tableTop + 15).stroke('#cccccc');

        // Line items
        let y = tableTop + 25;
        doc.fillColor('#000000');

        if (billing.lineItems) {
          for (const item of billing.lineItems) {
            doc.text(item.description, colDescription, y, { width: 260 });
            doc.text(item.type, colType, y);
            doc.text(formatCurrency(item.amount), colAmount, y);
            y += 20;
          }
        }

        // Separator
        doc.moveTo(colDescription, y + 5).lineTo(545, y + 5).stroke('#cccccc');
        y += 15;

        // Totals
        doc.fontSize(10);
        doc.text('Rent Amount:', colType, y);
        doc.text(formatCurrency(billing.rentAmount), colAmount, y);
        y += 18;

        if (Number(billing.lateFee) > 0) {
          doc.text('Late Fee:', colType, y);
          doc.text(formatCurrency(billing.lateFee), colAmount, y);
          y += 18;
        }

        if (Number(billing.adjustments) !== 0) {
          doc.text('Adjustments:', colType, y);
          doc.text(formatCurrency(billing.adjustments), colAmount, y);
          y += 18;
        }

        // Total line
        doc.moveTo(colType, y).lineTo(545, y).stroke('#000000');
        y += 8;

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total Amount:', colType, y);
        doc.text(formatCurrency(billing.totalAmount), colAmount, y);
        y += 22;

        doc.fontSize(10).font('Helvetica');
        doc.text('Paid Amount:', colType, y);
        doc.text(formatCurrency(billing.paidAmount), colAmount, y);
        y += 18;

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Balance Due:', colType, y);
        doc.text(formatCurrency(billing.balanceDue), colAmount, y);
        doc.font('Helvetica');

        // Footer
        doc.moveDown(4);
        doc.fontSize(8).fillColor('#999999');
        doc.text(
          'This is a computer-generated document. No signature is required.',
          50,
          doc.page.height - 80,
          { align: 'center' },
        );
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-MY')} at ${new Date().toLocaleTimeString('en-MY')}`,
          50,
          doc.page.height - 65,
          { align: 'center' },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
