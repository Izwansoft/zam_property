/**
 * CommissionService
 * Session 8.3 - Agent Commission
 *
 * Manages agent commission calculation, approval, and payment.
 * Commission is generated when:
 * - A tenancy becomes ACTIVE (BOOKING commission)
 * - A contract is RENEWED (RENEWAL commission)
 *
 * Commission rate is configurable per company/agent.
 * Typical: 1 month rent for new booking.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommissionStatus, CommissionType, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  CalculateCommissionDto,
  CommissionQueryDto,
  ApproveCommissionDto,
  MarkPaidDto,
} from './dto';

// ============================================
// VIEW INTERFACES
// ============================================

export interface CommissionView {
  id: string;
  agentId: string;
  tenancyId: string;
  type: string;
  dealValue: any; // Decimal
  rate: any; // Decimal
  amount: any; // Decimal
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  paidRef: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  agent?: {
    id: string;
    renNumber: string | null;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
    company: {
      id: string;
      name: string;
    };
  };
  tenancy?: {
    id: string;
    status: string;
    monthlyRent: any;
    listing: {
      id: string;
      title: string;
    };
  };
}

export interface CommissionListResult {
  data: CommissionView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommissionSummary {
  totalCommissions: number;
  totalAmount: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  paidCount: number;
  paidAmount: number;
}

// ============================================
// INCLUDE RELATIONS
// ============================================

const includeCommissionRelations = {
  agent: {
    select: {
      id: true,
      renNumber: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  tenancy: {
    select: {
      id: true,
      status: true,
      monthlyRent: true,
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
};

// Default commission rate: 1 month rent for BOOKING, 0.5 month for RENEWAL
const DEFAULT_RATES: Record<CommissionType, number> = {
  BOOKING: 1.0,
  RENEWAL: 0.5,
};

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // CALCULATE & CREATE COMMISSION
  // ============================================

  async calculateCommission(dto: CalculateCommissionDto): Promise<CommissionView> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify agent exists within partner scope
    const agent = await this.prisma.agent.findFirst({
      where: {
        id: dto.agentId,
        deletedAt: null,
        company: { partnerId },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${dto.agentId} not found`);
    }

    // Verify tenancy exists within partner scope
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: dto.tenancyId,
        partnerId,
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${dto.tenancyId} not found`);
    }

    // Determine commission rate
    const rate = dto.rate !== undefined ? dto.rate : DEFAULT_RATES[dto.type];

    // Calculate commission amount: monthlyRent * rate
    const dealValue = Number(tenancy.monthlyRent);
    const amount = Math.round(dealValue * rate * 100) / 100;

    const commission = await this.prisma.agentCommission.create({
      data: {
        agentId: dto.agentId,
        tenancyId: dto.tenancyId,
        type: dto.type,
        dealValue: tenancy.monthlyRent,
        rate: new Prisma.Decimal(rate),
        amount: new Prisma.Decimal(amount),
        notes: dto.notes,
      },
      include: includeCommissionRelations,
    });

    this.logger.log(
      `Commission created: ${commission.id} (${dto.type}, agent=${dto.agentId}, amount=${amount})`,
    );

    this.eventEmitter.emit('commission.created', {
      commissionId: commission.id,
      agentId: dto.agentId,
      tenancyId: dto.tenancyId,
      type: dto.type,
      amount,
    });

    return commission as CommissionView;
  }

  // ============================================
  // GET COMMISSION
  // ============================================

  async getCommission(commissionId: string): Promise<CommissionView> {
    const { partnerId } = this.PartnerContext.getContext();

    const commission = await this.prisma.agentCommission.findFirst({
      where: {
        id: commissionId,
        agent: { company: { partnerId } },
      },
      include: includeCommissionRelations,
    });

    if (!commission) {
      throw new NotFoundException(`Commission ${commissionId} not found`);
    }

    return commission as CommissionView;
  }

  // ============================================
  // LIST COMMISSIONS
  // ============================================

  async listCommissions(query: CommissionQueryDto): Promise<CommissionListResult> {
    const { partnerId } = this.PartnerContext.getContext();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      agent: { company: { partnerId } },
    };

    if (query.agentId) {
      where.agentId = query.agentId;
    }

    if (query.tenancyId) {
      where.tenancyId = query.tenancyId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.agentCommission.findMany({
        where,
        include: includeCommissionRelations,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.agentCommission.count({ where }),
    ]);

    return {
      data: data as CommissionView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // LIST AGENT COMMISSIONS
  // ============================================

  async listAgentCommissions(
    agentId: string,
    query: CommissionQueryDto,
  ): Promise<CommissionListResult> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify agent exists
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, company: { partnerId } },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      agentId,
      agent: { company: { partnerId } },
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.agentCommission.findMany({
        where,
        include: includeCommissionRelations,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.agentCommission.count({ where }),
    ]);

    return {
      data: data as CommissionView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // APPROVE COMMISSION
  // ============================================

  async approveCommission(
    commissionId: string,
    approvedBy: string,
    dto?: ApproveCommissionDto,
  ): Promise<CommissionView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.agentCommission.findFirst({
      where: {
        id: commissionId,
        agent: { company: { partnerId } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Commission ${commissionId} not found`);
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Commission ${commissionId} is ${existing.status}, only PENDING commissions can be approved`,
      );
    }

    const updateData: any = {
      status: 'APPROVED' as CommissionStatus,
      approvedBy,
      approvedAt: new Date(),
    };

    if (dto?.notes) {
      updateData.notes = existing.notes
        ? `${existing.notes}\n[Approval] ${dto.notes}`
        : `[Approval] ${dto.notes}`;
    }

    const commission = await this.prisma.agentCommission.update({
      where: { id: commissionId },
      data: updateData,
      include: includeCommissionRelations,
    });

    this.logger.log(`Commission approved: ${commissionId} by ${approvedBy}`);

    this.eventEmitter.emit('commission.approved', {
      commissionId: commission.id,
      agentId: commission.agentId,
      amount: Number(commission.amount),
      approvedBy,
    });

    return commission as CommissionView;
  }

  // ============================================
  // MARK COMMISSION AS PAID
  // ============================================

  async markPaid(commissionId: string, dto?: MarkPaidDto): Promise<CommissionView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.agentCommission.findFirst({
      where: {
        id: commissionId,
        agent: { company: { partnerId } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Commission ${commissionId} not found`);
    }

    if (existing.status !== 'APPROVED') {
      throw new BadRequestException(
        `Commission ${commissionId} is ${existing.status}, only APPROVED commissions can be marked paid`,
      );
    }

    const updateData: any = {
      status: 'PAID' as CommissionStatus,
      paidAt: new Date(),
    };

    if (dto?.paidRef) {
      updateData.paidRef = dto.paidRef;
    }

    if (dto?.notes) {
      updateData.notes = existing.notes
        ? `${existing.notes}\n[Payment] ${dto.notes}`
        : `[Payment] ${dto.notes}`;
    }

    const commission = await this.prisma.agentCommission.update({
      where: { id: commissionId },
      data: updateData,
      include: includeCommissionRelations,
    });

    // Update agent total revenue
    await this.prisma.agent.update({
      where: { id: commission.agentId },
      data: {
        totalRevenue: {
          increment: commission.amount,
        },
        totalDeals: {
          increment: 1,
        },
      },
    });

    this.logger.log(
      `Commission paid: ${commissionId}, ref=${dto?.paidRef ?? 'N/A'}`,
    );

    this.eventEmitter.emit('commission.paid', {
      commissionId: commission.id,
      agentId: commission.agentId,
      amount: Number(commission.amount),
      paidRef: dto?.paidRef,
    });

    return commission as CommissionView;
  }

  // ============================================
  // CANCEL COMMISSION
  // ============================================

  async cancelCommission(commissionId: string): Promise<CommissionView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.agentCommission.findFirst({
      where: {
        id: commissionId,
        agent: { company: { partnerId } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Commission ${commissionId} not found`);
    }

    if (existing.status === 'PAID') {
      throw new BadRequestException(
        `Commission ${commissionId} is already PAID and cannot be cancelled`,
      );
    }

    const commission = await this.prisma.agentCommission.update({
      where: { id: commissionId },
      data: { status: 'CANCELLED' as CommissionStatus },
      include: includeCommissionRelations,
    });

    this.logger.log(`Commission cancelled: ${commissionId}`);

    this.eventEmitter.emit('commission.cancelled', {
      commissionId: commission.id,
      agentId: commission.agentId,
    });

    return commission as CommissionView;
  }

  // ============================================
  // GET AGENT COMMISSION SUMMARY
  // ============================================

  async getAgentCommissionSummary(agentId: string): Promise<CommissionSummary> {
    const { partnerId } = this.PartnerContext.getContext();

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, company: { partnerId } },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    const commissions = await this.prisma.agentCommission.findMany({
      where: { agentId },
      select: { status: true, amount: true },
    });

    const summary: CommissionSummary = {
      totalCommissions: commissions.length,
      totalAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      approvedCount: 0,
      approvedAmount: 0,
      paidCount: 0,
      paidAmount: 0,
    };

    for (const c of commissions) {
      const amount = Number(c.amount);
      summary.totalAmount = Math.round((summary.totalAmount + amount) * 100) / 100;

      switch (c.status) {
        case 'PENDING':
          summary.pendingCount++;
          summary.pendingAmount = Math.round((summary.pendingAmount + amount) * 100) / 100;
          break;
        case 'APPROVED':
          summary.approvedCount++;
          summary.approvedAmount = Math.round((summary.approvedAmount + amount) * 100) / 100;
          break;
        case 'PAID':
          summary.paidCount++;
          summary.paidAmount = Math.round((summary.paidAmount + amount) * 100) / 100;
          break;
      }
    }

    return summary;
  }

  // ============================================
  // EVENT HANDLERS - Auto-create commissions
  // ============================================

  /**
   * When a tenancy becomes ACTIVE, check if an agent is assigned
   * to the listing and auto-create a BOOKING commission.
   */
  @OnEvent('tenancy.activated')
  async handleTenancyActivated(event: { tenancyId: string; partnerId: string }): Promise<void> {
    try {
      const tenancy = await this.prisma.tenancy.findUnique({
        where: { id: event.tenancyId },
        select: { id: true, listingId: true, monthlyRent: true, partnerId: true },
      });

      if (!tenancy) return;

      // Find agent assigned to this listing
      const agentListing = await this.prisma.agentListing.findFirst({
        where: {
          listingId: tenancy.listingId,
          removedAt: null,
        },
        select: { agentId: true },
      });

      if (!agentListing) return;

      // Check if commission already exists for this tenancy + agent + BOOKING
      const existingCommission = await this.prisma.agentCommission.findFirst({
        where: {
          agentId: agentListing.agentId,
          tenancyId: event.tenancyId,
          type: 'BOOKING',
        },
      });

      if (existingCommission) return; // Already created

      const rate = DEFAULT_RATES.BOOKING;
      const dealValue = Number(tenancy.monthlyRent);
      const amount = Math.round(dealValue * rate * 100) / 100;

      const commission = await this.prisma.agentCommission.create({
        data: {
          agentId: agentListing.agentId,
          tenancyId: event.tenancyId,
          type: 'BOOKING',
          dealValue: tenancy.monthlyRent,
          rate: new Prisma.Decimal(rate),
          amount: new Prisma.Decimal(amount),
          notes: 'Auto-generated on tenancy activation',
        },
      });

      this.logger.log(
        `Auto-created BOOKING commission: ${commission.id} for agent ${agentListing.agentId}`,
      );

      this.eventEmitter.emit('commission.created', {
        commissionId: commission.id,
        agentId: agentListing.agentId,
        tenancyId: event.tenancyId,
        type: 'BOOKING',
        amount,
      });
    } catch (error) {
      this.logger.error(`Failed to auto-create booking commission: ${error}`);
    }
  }

  /**
   * When a contract is renewed, auto-create a RENEWAL commission
   * for the agent assigned to the listing.
   */
  @OnEvent('contract.renewed')
  async handleContractRenewed(event: { contractId: string; tenancyId: string; partnerId: string }): Promise<void> {
    try {
      const tenancy = await this.prisma.tenancy.findUnique({
        where: { id: event.tenancyId },
        select: { id: true, listingId: true, monthlyRent: true, partnerId: true },
      });

      if (!tenancy) return;

      // Find agent assigned to this listing
      const agentListing = await this.prisma.agentListing.findFirst({
        where: {
          listingId: tenancy.listingId,
          removedAt: null,
        },
        select: { agentId: true },
      });

      if (!agentListing) return;

      // Check for existing RENEWAL commission for this tenancy
      const existingCommission = await this.prisma.agentCommission.findFirst({
        where: {
          agentId: agentListing.agentId,
          tenancyId: event.tenancyId,
          type: 'RENEWAL',
        },
      });

      if (existingCommission) return;

      const rate = DEFAULT_RATES.RENEWAL;
      const dealValue = Number(tenancy.monthlyRent);
      const amount = Math.round(dealValue * rate * 100) / 100;

      const commission = await this.prisma.agentCommission.create({
        data: {
          agentId: agentListing.agentId,
          tenancyId: event.tenancyId,
          type: 'RENEWAL',
          dealValue: tenancy.monthlyRent,
          rate: new Prisma.Decimal(rate),
          amount: new Prisma.Decimal(amount),
          notes: 'Auto-generated on contract renewal',
        },
      });

      this.logger.log(
        `Auto-created RENEWAL commission: ${commission.id} for agent ${agentListing.agentId}`,
      );

      this.eventEmitter.emit('commission.created', {
        commissionId: commission.id,
        agentId: agentListing.agentId,
        tenancyId: event.tenancyId,
        type: 'RENEWAL',
        amount,
      });
    } catch (error) {
      this.logger.error(`Failed to auto-create renewal commission: ${error}`);
    }
  }
}
