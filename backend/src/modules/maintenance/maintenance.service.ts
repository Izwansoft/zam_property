import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Maintenance,
  MaintenanceStatus,
  MaintenancePriority,
  TenancyStatus,
  Role,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';
import { S3Service } from '@infrastructure/storage';

import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  MaintenanceQueryDto,
  AddAttachmentDto,
  AddUpdateDto,
  VerifyMaintenanceDto,
  AssignMaintenanceDto,
  ResolveMaintenanceDto,
  CloseMaintenanceDto,
  CancelMaintenanceDto,
} from './dto';
import { MaintenanceStateMachine } from './maintenance.state-machine';

// ============================================
// VIEW TYPES
// ============================================

/**
 * Maintenance ticket with relations
 */
export interface MaintenanceView extends Maintenance {
  tenancy?: {
    id: string;
    status: TenancyStatus;
    listing: {
      id: string;
      title: string;
    };
    owner: {
      id: string;
      name: string;
    };
    tenant: {
      id: string;
      user: {
        fullName: string;
        email: string;
      };
    };
  };
  attachments?: AttachmentView[];
  updates?: UpdateView[];
  _count?: {
    attachments: number;
    updates: number;
  };
}

export interface AttachmentView {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface UpdateView {
  id: string;
  message: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: Date;
}

// ============================================
// EVENTS
// ============================================

export class MaintenanceCreatedEvent {
  constructor(
    public readonly maintenanceId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly category: string,
    public readonly priority: string,
  ) {}
}

export class MaintenanceUpdatedEvent {
  constructor(
    public readonly maintenanceId: string,
    public readonly partnerId: string,
    public readonly changes: Record<string, unknown>,
  ) {}
}

export class MaintenanceAttachmentAddedEvent {
  constructor(
    public readonly maintenanceId: string,
    public readonly attachmentId: string,
    public readonly partnerId: string,
  ) {}
}

export class MaintenanceCommentAddedEvent {
  constructor(
    public readonly maintenanceId: string,
    public readonly updateId: string,
    public readonly partnerId: string,
    public readonly isInternal: boolean,
  ) {}
}

export class MaintenanceStatusChangedEvent {
  constructor(
    public readonly maintenanceId: string,
    public readonly partnerId: string,
    public readonly fromStatus: string,
    public readonly toStatus: string,
    public readonly changedBy: string,
  ) {}
}

// ============================================
// SERVICE
// ============================================

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  /**
   * Include clause for loading relations
   */
  private readonly includeRelations = {
    tenancy: {
      select: {
        id: true,
        status: true,
        listing: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true } },
        tenant: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    },
    attachments: {
      orderBy: { uploadedAt: 'desc' as const },
    },
    updates: {
      orderBy: { createdAt: 'desc' as const },
    },
    _count: {
      select: { attachments: true, updates: true },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2,
    private readonly stateMachine: MaintenanceStateMachine,
  ) {}

  // ============================================
  // TICKET MANAGEMENT
  // ============================================

  /**
   * Create a new maintenance ticket
   */
  async createTicket(dto: CreateMaintenanceDto, userId: string): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();

    // Verify tenancy exists and belongs to partner
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: dto.tenancyId,
        partnerId: partner.partnerId,
      },
      select: {
        id: true,
        status: true,
        tenantId: true,
        ownerId: true,
      },
    });

    if (!tenancy) {
      throw new NotFoundException('Tenancy not found');
    }

    // Only allow tickets for active/termination_requested tenancies
    if (
      tenancy.status !== TenancyStatus.ACTIVE &&
      tenancy.status !== TenancyStatus.TERMINATION_REQUESTED
    ) {
      throw new BadRequestException(
        'Maintenance tickets can only be created for active tenancies',
      );
    }

    // Generate unique ticket number
    const ticketNumber = await this.generateTicketNumber(partner.partnerId);

    const maintenance = await this.prisma.maintenance.create({
      data: {
        tenancyId: dto.tenancyId,
        ticketNumber,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        location: dto.location,
        priority: (dto.priority as MaintenancePriority) || MaintenancePriority.MEDIUM,
        reportedBy: userId,
        estimatedCost: dto.estimatedCost != null ? dto.estimatedCost : undefined,
      },
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${ticketNumber} created for tenancy ${dto.tenancyId}`);

    // Emit event
    this.eventEmitter.emit(
      'maintenance.created',
      new MaintenanceCreatedEvent(
        maintenance.id,
        dto.tenancyId,
        partner.partnerId,
        dto.category,
        maintenance.priority,
      ),
    );

    return maintenance as MaintenanceView;
  }

  /**
   * Update a maintenance ticket
   */
  async updateTicket(
    id: string,
    dto: UpdateMaintenanceDto,
    userId: string,
  ): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();

    const existing = await this.findTicketOrThrow(id, partner.partnerId);

    // Cannot update closed or cancelled tickets
    if (
      existing.status === MaintenanceStatus.CLOSED ||
      existing.status === MaintenanceStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot update a closed or cancelled ticket');
    }

    const updateData: Prisma.MaintenanceUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.priority !== undefined)
      updateData.priority = dto.priority as MaintenancePriority;
    if (dto.estimatedCost !== undefined) updateData.estimatedCost = dto.estimatedCost;
    if (dto.actualCost !== undefined) updateData.actualCost = dto.actualCost;
    if (dto.paidBy !== undefined) updateData.paidBy = dto.paidBy;
    if (dto.resolution !== undefined) updateData.resolution = dto.resolution;

    // Handle assignment
    if (dto.assignedTo !== undefined) {
      updateData.assignedTo = dto.assignedTo;
      if (dto.assignedTo && !existing.assignedAt) {
        updateData.assignedAt = new Date();
      }
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${existing.ticketNumber} updated`);

    // Emit event
    this.eventEmitter.emit(
      'maintenance.updated',
      new MaintenanceUpdatedEvent(id, partner.partnerId, dto as Record<string, unknown>),
    );

    return updated as MaintenanceView;
  }

  /**
   * Get a single maintenance ticket by ID
   */
  async getTicket(id: string, userId: string, userRole: Role): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();

    const ticket = await this.prisma.maintenance.findFirst({
      where: {
        id,
        tenancy: { partnerId: partner.partnerId },
      },
      include: this.includeRelations,
    });

    if (!ticket) {
      throw new NotFoundException('Maintenance ticket not found');
    }

    // Filter internal updates for tenants
    if (userRole === Role.CUSTOMER || userRole === Role.GUEST) {
      const filtered = ticket as MaintenanceView;
      if (filtered.updates) {
        filtered.updates = filtered.updates.filter((u) => !u.isInternal);
      }
      return filtered;
    }

    return ticket as MaintenanceView;
  }

  /**
   * List maintenance tickets with filters
   */
  async listTickets(
    query: MaintenanceQueryDto,
    userId: string,
    userRole: Role,
  ): Promise<{ data: MaintenanceView[]; total: number; page: number; limit: number }> {
    const partner = this.PartnerContext.getContext();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceWhereInput = {
      tenancy: { partnerId: partner.partnerId },
    };

    // Apply filters
    if (query.status) {
      where.status = query.status as MaintenanceStatus;
    }
    if (query.priority) {
      where.priority = query.priority as MaintenancePriority;
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.tenancyId) {
      where.tenancyId = query.tenancyId;
    }
    if (query.search) {
      where.OR = [
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Role-based filtering: tenants only see their own tickets
    if (userRole === Role.CUSTOMER) {
      where.tenancy = {
        ...(where.tenancy as Prisma.TenancyWhereInput),
        tenant: { userId },
      };
    }

    // Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.MaintenanceOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.maintenance.findMany({
        where,
        include: {
          tenancy: {
            select: {
              id: true,
              status: true,
              listing: { select: { id: true, title: true } },
              owner: { select: { id: true, name: true } },
              tenant: {
                select: {
                  id: true,
                  user: { select: { fullName: true, email: true } },
                },
              },
            },
          },
          _count: { select: { attachments: true, updates: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.maintenance.count({ where }),
    ]);

    return {
      data: data as MaintenanceView[],
      total,
      page,
      limit,
    };
  }

  // ============================================
  // ATTACHMENTS
  // ============================================

  /**
   * Add an attachment to a maintenance ticket
   * Returns a presigned upload URL for the client to upload to S3
   */
  async addAttachment(
    maintenanceId: string,
    dto: AddAttachmentDto,
    userId: string,
  ): Promise<{ attachment: AttachmentView; uploadUrl: string; expiresAt: Date }> {
    const partner = this.PartnerContext.getContext();

    const ticket = await this.findTicketOrThrow(maintenanceId, partner.partnerId);

    // Cannot add attachments to closed/cancelled tickets
    if (
      ticket.status === MaintenanceStatus.CLOSED ||
      ticket.status === MaintenanceStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot add attachments to a closed or cancelled ticket');
    }

    // Generate S3 key
    const storageKey = `tenants/${partner.partnerId}/maintenance/${maintenanceId}/${Date.now()}-${dto.fileName}`;

    // Get presigned upload URL
    const presigned = await this.s3Service.getPresignedUploadUrl({
      key: storageKey,
      contentType: dto.mimeType,
      expiresIn: 3600, // 1 hour
    });

    // Create attachment record
    const attachment = await this.prisma.maintenanceAttachment.create({
      data: {
        maintenanceId,
        type: dto.type,
        fileName: dto.fileName,
        fileUrl: storageKey,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        uploadedBy: userId,
      },
    });

    this.logger.log(
      `Attachment ${attachment.id} added to maintenance ${ticket.ticketNumber}`,
    );

    // Emit event
    this.eventEmitter.emit(
      'maintenance.attachment.added',
      new MaintenanceAttachmentAddedEvent(maintenanceId, attachment.id, partner.partnerId),
    );

    return {
      attachment: attachment as AttachmentView,
      uploadUrl: presigned.url,
      expiresAt: presigned.expiresAt,
    };
  }

  /**
   * List attachments for a maintenance ticket
   */
  async listAttachments(maintenanceId: string): Promise<AttachmentView[]> {
    const partner = this.PartnerContext.getContext();
    await this.findTicketOrThrow(maintenanceId, partner.partnerId);

    const attachments = await this.prisma.maintenanceAttachment.findMany({
      where: { maintenanceId },
      orderBy: { uploadedAt: 'desc' },
    });

    return attachments as AttachmentView[];
  }

  // ============================================
  // COMMENTS / UPDATES
  // ============================================

  /**
   * Add a comment/update to a maintenance ticket
   */
  async addUpdate(
    maintenanceId: string,
    dto: AddUpdateDto,
    userId: string,
  ): Promise<UpdateView> {
    const partner = this.PartnerContext.getContext();

    const ticket = await this.findTicketOrThrow(maintenanceId, partner.partnerId);

    // Cannot add comments to closed/cancelled tickets
    if (
      ticket.status === MaintenanceStatus.CLOSED ||
      ticket.status === MaintenanceStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot add comments to a closed or cancelled ticket');
    }

    const update = await this.prisma.maintenanceUpdate.create({
      data: {
        maintenanceId,
        message: dto.message,
        isInternal: dto.isInternal ?? false,
        createdBy: userId,
      },
    });

    this.logger.log(
      `Comment ${update.id} added to maintenance ${ticket.ticketNumber}${
        dto.isInternal ? ' (internal)' : ''
      }`,
    );

    // Emit event
    this.eventEmitter.emit(
      'maintenance.comment.added',
      new MaintenanceCommentAddedEvent(
        maintenanceId,
        update.id,
        partner.partnerId,
        dto.isInternal ?? false,
      ),
    );

    return update as UpdateView;
  }

  /**
   * List comments/updates for a maintenance ticket
   * Tenants don't see internal notes
   */
  async listUpdates(
    maintenanceId: string,
    userRole: Role,
  ): Promise<UpdateView[]> {
    const partner = this.PartnerContext.getContext();
    await this.findTicketOrThrow(maintenanceId, partner.partnerId);

    const where: Prisma.MaintenanceUpdateWhereInput = {
      maintenanceId,
    };

    // Hide internal notes from tenants
    if (userRole === Role.CUSTOMER || userRole === Role.GUEST) {
      where.isInternal = false;
    }

    const updates = await this.prisma.maintenanceUpdate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return updates as UpdateView[];
  }

  // ============================================
  // WORKFLOW ACTIONS
  // ============================================

  /**
   * Verify a maintenance ticket (OPEN → VERIFIED)
   * Admin/vendor confirms the reported issue is valid
   */
  async verifyTicket(
    id: string,
    dto: VerifyMaintenanceDto,
    userId: string,
  ): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();
    const ticket = await this.findTicketOrThrow(id, partner.partnerId);

    const result = await this.stateMachine.transition(
      ticket.status,
      'verify',
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.VERIFIED,
        verifiedBy: userId,
        verifiedAt: new Date(),
        verificationNotes: dto.verificationNotes,
      },
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${ticket.ticketNumber} verified by ${userId}`);

    this.emitStatusChanged(id, partner.partnerId, ticket.status, MaintenanceStatus.VERIFIED, userId);
    this.addSystemUpdate(id, `Ticket verified${dto.verificationNotes ? ': ' + dto.verificationNotes : ''}`, userId);

    return updated as MaintenanceView;
  }

  /**
   * Assign a maintenance ticket (VERIFIED → ASSIGNED)
   * Assign to vendor staff or external contractor
   */
  async assignTicket(
    id: string,
    dto: AssignMaintenanceDto,
    userId: string,
  ): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();
    const ticket = await this.findTicketOrThrow(id, partner.partnerId);

    const result = await this.stateMachine.transition(
      ticket.status,
      'assign',
      { assignedTo: dto.assignedTo },
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updateData: Prisma.MaintenanceUpdateInput = {
      status: MaintenanceStatus.ASSIGNED,
      assignedTo: dto.assignedTo,
      assignedAt: new Date(),
    };

    // External contractor details
    if (dto.contractorName) {
      updateData.contractorName = dto.contractorName;
    }
    if (dto.contractorPhone) {
      updateData.contractorPhone = dto.contractorPhone;
    }
    if (dto.estimatedCost != null) {
      updateData.estimatedCost = dto.estimatedCost;
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${ticket.ticketNumber} assigned to ${dto.assignedTo}`);

    const assignMsg = dto.contractorName
      ? `Assigned to external contractor: ${dto.contractorName}${dto.contractorPhone ? ' (' + dto.contractorPhone + ')' : ''}`
      : `Assigned to: ${dto.assignedTo}`;
    this.emitStatusChanged(id, partner.partnerId, ticket.status, MaintenanceStatus.ASSIGNED, userId);
    this.addSystemUpdate(id, assignMsg, userId);

    return updated as MaintenanceView;
  }

  /**
   * Start work on a maintenance ticket (ASSIGNED → IN_PROGRESS)
   */
  async startWork(id: string, userId: string): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();
    const ticket = await this.findTicketOrThrow(id, partner.partnerId);

    const result = await this.stateMachine.transition(
      ticket.status,
      'start',
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${ticket.ticketNumber} work started`);

    this.emitStatusChanged(id, partner.partnerId, ticket.status, MaintenanceStatus.IN_PROGRESS, userId);
    this.addSystemUpdate(id, 'Work has started on this ticket', userId);

    return updated as MaintenanceView;
  }

  /**
   * Resolve a maintenance ticket (IN_PROGRESS → PENDING_APPROVAL)
   * Records resolution details and actual cost
   */
  async resolveTicket(
    id: string,
    dto: ResolveMaintenanceDto,
    userId: string,
  ): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();
    const ticket = await this.findTicketOrThrow(id, partner.partnerId);

    const result = await this.stateMachine.transition(
      ticket.status,
      'resolve',
      { resolution: dto.resolution },
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updateData: Prisma.MaintenanceUpdateInput = {
      status: MaintenanceStatus.PENDING_APPROVAL,
      resolution: dto.resolution,
      resolvedAt: new Date(),
      resolvedBy: userId,
    };

    if (dto.actualCost != null) {
      updateData.actualCost = dto.actualCost;
    }
    if (dto.paidBy) {
      updateData.paidBy = dto.paidBy;
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${ticket.ticketNumber} resolved by ${userId}`);

    this.emitStatusChanged(id, partner.partnerId, ticket.status, MaintenanceStatus.PENDING_APPROVAL, userId);

    // Log cost comparison
    const costMsg = dto.actualCost != null && ticket.estimatedCost
      ? ` (estimated: ${ticket.estimatedCost}, actual: ${dto.actualCost})`
      : '';
    this.addSystemUpdate(id, `Ticket resolved: ${dto.resolution}${costMsg}`, userId);

    return updated as MaintenanceView;
  }

  /**
   * Close a maintenance ticket (PENDING_APPROVAL | CLAIM_APPROVED → CLOSED)
   */
  async closeTicket(
    id: string,
    dto: CloseMaintenanceDto,
    userId: string,
  ): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();
    const ticket = await this.findTicketOrThrow(id, partner.partnerId);

    const result = await this.stateMachine.transition(
      ticket.status,
      'close',
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.CLOSED,
        closedAt: new Date(),
      },
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${ticket.ticketNumber} closed by ${userId}`);

    this.emitStatusChanged(id, partner.partnerId, ticket.status, MaintenanceStatus.CLOSED, userId);
    this.addSystemUpdate(id, `Ticket closed${dto.closingNotes ? ': ' + dto.closingNotes : ''}`, userId);

    return updated as MaintenanceView;
  }

  /**
   * Cancel a maintenance ticket (OPEN | VERIFIED | ASSIGNED → CANCELLED)
   */
  async cancelTicket(
    id: string,
    dto: CancelMaintenanceDto,
    userId: string,
  ): Promise<MaintenanceView> {
    const partner = this.PartnerContext.getContext();
    const ticket = await this.findTicketOrThrow(id, partner.partnerId);

    const result = await this.stateMachine.transition(
      ticket.status,
      'cancel',
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.CANCELLED,
      },
      include: this.includeRelations,
    });

    this.logger.log(`Maintenance ticket ${ticket.ticketNumber} cancelled by ${userId}`);

    this.emitStatusChanged(id, partner.partnerId, ticket.status, MaintenanceStatus.CANCELLED, userId);
    this.addSystemUpdate(id, `Ticket cancelled${dto.reason ? ': ' + dto.reason : ''}`, userId);

    return updated as MaintenanceView;
  }

  /**
   * Get available workflow actions for a ticket
   */
  getAvailableActions(status: MaintenanceStatus): string[] {
    return this.stateMachine.getAvailableEvents(status);
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Emit maintenance status changed event
   */
  private emitStatusChanged(
    maintenanceId: string,
    partnerId: string,
    fromStatus: MaintenanceStatus,
    toStatus: MaintenanceStatus,
    changedBy: string,
  ): void {
    this.eventEmitter.emit(
      'maintenance.status.changed',
      new MaintenanceStatusChangedEvent(
        maintenanceId,
        partnerId,
        fromStatus,
        toStatus,
        changedBy,
      ),
    );
  }

  /**
   * Add a system-generated update to the ticket timeline
   */
  private addSystemUpdate(
    maintenanceId: string,
    message: string,
    userId: string,
  ): void {
    this.prisma.maintenanceUpdate
      .create({
        data: {
          maintenanceId,
          message: `[System] ${message}`,
          isInternal: true,
          createdBy: userId,
        },
      })
      .catch((err) => {
        this.logger.error(`Failed to add system update for ${maintenanceId}: ${err.message}`);
      });
  }

  /**
   * Find a maintenance ticket or throw NotFoundException
   */
  private async findTicketOrThrow(
    id: string,
    partnerId: string,
  ): Promise<Maintenance> {
    const ticket = await this.prisma.maintenance.findFirst({
      where: {
        id,
        tenancy: { partnerId },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Maintenance ticket not found');
    }

    return ticket;
  }

  /**
   * Generate a unique ticket number: MNT-YYYYMMDD-XXXX
   */
  private async generateTicketNumber(partnerId: string): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `MNT-${dateStr}-`;

    // Count existing tickets today for this partner
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const count = await this.prisma.maintenance.count({
      where: {
        ticketNumber: { startsWith: prefix },
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  }
}
