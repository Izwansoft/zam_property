/**
 * AgentService
 * Session 8.2 - Agent Module
 *
 * Manages agent registration, profile updates, listing assignment,
 * and referral code generation.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AgentStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  RegisterAgentDto,
  UpdateAgentDto,
  AssignListingDto,
  AgentQueryDto,
} from './dto';
import { randomBytes } from 'crypto';

// ============================================
// VIEW INTERFACES
// ============================================

export interface AgentView {
  id: string;
  companyId: string | null;
  userId: string;
  renNumber: string | null;
  renExpiry: Date | null;
  totalListings: number;
  totalDeals: number;
  totalRevenue: any; // Decimal
  referralCode: string | null;
  referredBy: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  company?: {
    id: string;
    name: string;
    type: string;
  } | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  agentListings?: AgentListingView[];
}

export interface AgentListingView {
  id: string;
  agentId: string;
  listingId: string;
  assignedAt: Date;
  removedAt: Date | null;
  listing?: {
    id: string;
    title: string;
    status: string;
    price: any;
  };
}

export interface AgentListResult {
  data: AgentView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// EVENT CLASSES
// ============================================

export class AgentRegisteredEvent {
  constructor(
    public readonly agentId: string,
    public readonly companyId: string | null,
    public readonly userId: string,
    public readonly partnerId: string,
  ) {}
}

export class AgentListingAssignedEvent {
  constructor(
    public readonly agentId: string,
    public readonly listingId: string,
    public readonly partnerId: string,
  ) {}
}

export class AgentListingUnassignedEvent {
  constructor(
    public readonly agentId: string,
    public readonly listingId: string,
    public readonly partnerId: string,
  ) {}
}

// ============================================
// INCLUDE RELATIONS
// ============================================

const includeAgentRelations = {
  company: {
    select: { id: true, name: true, type: true },
  },
  user: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
  agentListings: {
    where: { removedAt: null },
    include: {
      listing: {
        select: { id: true, title: true, status: true, price: true },
      },
    },
    orderBy: { assignedAt: 'desc' as const },
  },
};

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // REGISTER AGENT
  // ============================================

  async registerAgent(dto: RegisterAgentDto): Promise<AgentView> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify company belongs to partner (if provided)
    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: dto.companyId, partnerId, deletedAt: null },
      });

      if (!company) {
        throw new NotFoundException(`Company ${dto.companyId} not found`);
      }
    }

    // Verify user exists in same partner
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, partnerId },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    // Check for duplicate agent registration
    const existingWhere: Prisma.AgentWhereInput = dto.companyId
      ? { companyId: dto.companyId, userId: dto.userId, deletedAt: null }
      : { companyId: null, userId: dto.userId, deletedAt: null };

    const existing = await this.prisma.agent.findFirst({
      where: existingWhere,
    });

    if (existing) {
      throw new ConflictException(
        dto.companyId
          ? `User ${dto.userId} is already registered as an agent in company ${dto.companyId}`
          : `User ${dto.userId} is already registered as an independent agent`,
      );
    }

    // Generate referral code
    const referralCode = await this.generateReferralCode();

    const agent = await this.prisma.agent.create({
      data: {
        companyId: dto.companyId || null,
        userId: dto.userId,
        renNumber: dto.renNumber || null,
        renExpiry: dto.renExpiry ? new Date(dto.renExpiry) : null,
        referralCode,
        referredBy: dto.referredBy || null,
        status: AgentStatus.ACTIVE,
      },
      include: includeAgentRelations,
    });

    this.logger.log(
      dto.companyId
        ? `Agent registered: ${user.fullName} (${agent.id}) in company ${dto.companyId}`
        : `Independent agent registered: ${user.fullName} (${agent.id})`,
    );

    this.eventEmitter.emit(
      'agent.registered',
      new AgentRegisteredEvent(agent.id, dto.companyId || null, dto.userId, partnerId),
    );

    return agent as AgentView;
  }

  // ============================================
  // GET AGENT
  // ============================================

  async getAgent(agentId: string): Promise<AgentView> {
    const { partnerId } = this.PartnerContext.getContext();

    const agent = await this.prisma.agent.findFirst({
      where: {
        id: agentId,
        deletedAt: null,
        user: { partnerId },
      },
      include: includeAgentRelations,
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    return agent as AgentView;
  }

  // ============================================
  // LIST AGENTS
  // ============================================

  async listAgents(query: AgentQueryDto): Promise<AgentListResult> {
    const { partnerId } = this.PartnerContext.getContext();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AgentWhereInput = {
      deletedAt: null,
      user: { partnerId },
    };

    if (query.companyId) {
      where.companyId = query.companyId;
    }

    // Filter by independent (no company) vs agency agents
    if (query.isIndependent === true) {
      where.companyId = null;
    } else if (query.isIndependent === false) {
      where.companyId = { not: null };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { renNumber: { contains: query.search, mode: 'insensitive' } },
        { referralCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortDir = query.sortDir || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        include: includeAgentRelations,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: limit,
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      data: data as AgentView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // UPDATE AGENT PROFILE
  // ============================================

  async updateAgentProfile(agentId: string, dto: UpdateAgentDto): Promise<AgentView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, user: { partnerId } },
    });

    if (!existing) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    const updateData: Prisma.AgentUpdateInput = {};

    if (dto.renNumber !== undefined) updateData.renNumber = dto.renNumber;
    if (dto.renExpiry !== undefined) updateData.renExpiry = dto.renExpiry ? new Date(dto.renExpiry) : null;

    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: updateData,
      include: includeAgentRelations,
    });

    this.logger.log(`Agent profile updated: ${agentId}`);

    return agent as AgentView;
  }

  // ============================================
  // ASSIGN LISTING
  // ============================================

  async assignToListing(agentId: string, dto: AssignListingDto): Promise<AgentListingView> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify agent exists in partner scope
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, user: { partnerId } },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    // Verify listing exists in partner scope
    const listing = await this.prisma.listing.findFirst({
      where: { id: dto.listingId, partnerId, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${dto.listingId} not found`);
    }

    // Check for existing active assignment
    const existingAssignment = await this.prisma.agentListing.findFirst({
      where: {
        agentId,
        listingId: dto.listingId,
        removedAt: null,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Agent ${agentId} is already assigned to listing ${dto.listingId}`,
      );
    }

    const assignment = await this.prisma.agentListing.create({
      data: {
        agentId,
        listingId: dto.listingId,
      },
      include: {
        listing: {
          select: { id: true, title: true, status: true, price: true },
        },
      },
    });

    // Increment agent's totalListings
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { totalListings: { increment: 1 } },
    });

    this.logger.log(
      `Agent ${agentId} assigned to listing ${dto.listingId}`,
    );

    this.eventEmitter.emit(
      'agent.listing.assigned',
      new AgentListingAssignedEvent(agentId, dto.listingId, partnerId),
    );

    return assignment as AgentListingView;
  }

  // ============================================
  // UNASSIGN LISTING
  // ============================================

  async unassignFromListing(agentId: string, listingId: string): Promise<void> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify agent exists in partner scope
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, user: { partnerId } },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    // Find active assignment
    const assignment = await this.prisma.agentListing.findFirst({
      where: {
        agentId,
        listingId,
        removedAt: null,
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Agent ${agentId} is not assigned to listing ${listingId}`,
      );
    }

    // Soft-remove: set removedAt instead of deleting
    await this.prisma.agentListing.update({
      where: { id: assignment.id },
      data: { removedAt: new Date() },
    });

    // Decrement agent's totalListings (keep >= 0)
    if (agent.totalListings > 0) {
      await this.prisma.agent.update({
        where: { id: agentId },
        data: { totalListings: { decrement: 1 } },
      });
    }

    this.logger.log(`Agent ${agentId} unassigned from listing ${listingId}`);

    this.eventEmitter.emit(
      'agent.listing.unassigned',
      new AgentListingUnassignedEvent(agentId, listingId, partnerId),
    );
  }

  // ============================================
  // GET AGENT LISTINGS
  // ============================================

  async getAgentListings(agentId: string): Promise<AgentListingView[]> {
    const { partnerId } = this.PartnerContext.getContext();

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, user: { partnerId } },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    const listings = await this.prisma.agentListing.findMany({
      where: { agentId, removedAt: null },
      include: {
        listing: {
          select: { id: true, title: true, status: true, price: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return listings as AgentListingView[];
  }

  // ============================================
  // SUSPEND / REACTIVATE AGENT
  // ============================================

  async suspendAgent(agentId: string): Promise<AgentView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, user: { partnerId } },
    });

    if (!existing) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    if (existing.status === AgentStatus.SUSPENDED) {
      throw new BadRequestException('Agent is already suspended');
    }

    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.SUSPENDED },
      include: includeAgentRelations,
    });

    this.logger.log(`Agent suspended: ${agentId}`);

    return agent as AgentView;
  }

  async reactivateAgent(agentId: string): Promise<AgentView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, user: { partnerId } },
    });

    if (!existing) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    if (existing.status === AgentStatus.ACTIVE) {
      throw new BadRequestException('Agent is already active');
    }

    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.ACTIVE },
      include: includeAgentRelations,
    });

    this.logger.log(`Agent reactivated: ${agentId}`);

    return agent as AgentView;
  }

  // ============================================
  // GENERATE REFERRAL CODE
  // ============================================

  async generateReferralCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    // Generate a unique 8-character alphanumeric code
    while (!isUnique) {
      code = randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.prisma.agent.findFirst({
        where: { referralCode: code },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    return code!;
  }

  // ============================================
  // REGENERATE REFERRAL CODE (for existing agent)
  // ============================================

  async regenerateReferralCode(agentId: string): Promise<AgentView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.agent.findFirst({
      where: { id: agentId, deletedAt: null, user: { partnerId } },
    });

    if (!existing) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    const referralCode = await this.generateReferralCode();

    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { referralCode },
      include: includeAgentRelations,
    });

    this.logger.log(`Agent referral code regenerated: ${agentId} → ${referralCode}`);

    return agent as AgentView;
  }
}
