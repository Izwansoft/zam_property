import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenancyStatus, ManagementType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PartnerContextService } from '@core/partner-context';
import { PrismaService } from '@infrastructure/database';

import {
  TenancyRepository,
  TenancyView,
  TenancyDetailView,
  TenancyStatusHistoryView,
} from './tenancy.repository';
import { TenancyStateMachine, TenancyEvent } from './tenancy.state-machine';
import {
  CreateTenancyDto,
  UpdateTenancyDto,
  TenancyQueryDto,
  ConfirmBookingDto,
  ConfirmDepositDto,
  RequestTerminationDto,
  TerminateTenancyDto,
  ExtendTenancyDto,
  TransitionTenancyDto,
} from './dto';

// Result interfaces
export interface TenancyListResult {
  items: TenancyView[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Domain Events
export class TenancyCreatedEvent {
  constructor(
    public readonly tenancyId: string,
    public readonly listingId: string,
    public readonly tenantId: string,
    public readonly partnerId: string,
  ) {}
}

export class TenancyStatusChangedEvent {
  constructor(
    public readonly tenancyId: string,
    public readonly fromStatus: TenancyStatus | null,
    public readonly toStatus: TenancyStatus,
    public readonly reason: string | null,
    public readonly changedBy: string,
    public readonly partnerId: string,
  ) {}
}

export class TenancyBookedEvent extends TenancyStatusChangedEvent {}
export class TenancyActivatedEvent extends TenancyStatusChangedEvent {}
export class TenancyTerminatedEvent extends TenancyStatusChangedEvent {}
export class TenancyExtendedEvent extends TenancyStatusChangedEvent {}

@Injectable({ scope: Scope.REQUEST })
export class TenancyService {
  private readonly logger = new Logger(TenancyService.name);

  constructor(
    private readonly tenancyRepository: TenancyRepository,
    private readonly tenancyStateMachine: TenancyStateMachine,
    private readonly PartnerContext: PartnerContextService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new tenancy (booking application)
   * Only allowed for PARTNER_MANAGED listings
   */
  async create(dto: CreateTenancyDto, userId: string): Promise<TenancyDetailView> {
    const { listingId, tenantId, ...rest } = dto;

    // Validate listing exists and is PARTNER_MANAGED
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        partnerId: this.PartnerContext.partnerId,
      },
      select: {
        id: true,
        managementType: true,
        vendorId: true,
        status: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.managementType !== ManagementType.PARTNER_MANAGED) {
      throw new BadRequestException(
        'Tenancy can only be created for PARTNER_MANAGED properties',
      );
    }

    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException('Tenancy can only be created for published listings');
    }

    // Validate tenant exists
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        partnerId: this.PartnerContext.partnerId,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if listing already has an active tenancy
    const hasActiveTenancy = await this.tenancyRepository.hasActiveTenancy(listingId);
    if (hasActiveTenancy) {
      throw new ConflictException('This listing already has an active tenancy');
    }

    // Extract required and optional fields
    const { monthlyRent, securityDeposit, ...optionals } = rest;

    // Create tenancy
    const tenancy = await this.prisma.tenancy.create({
      data: {
        partnerId: this.PartnerContext.partnerId as string,
        listingId: listingId,
        tenantId: tenantId,
        ownerId: listing.vendorId,
        status: TenancyStatus.DRAFT,
        monthlyRent: monthlyRent,
        securityDeposit: securityDeposit,
        ...(optionals.moveInDate && { moveInDate: new Date(optionals.moveInDate) }),
        ...(optionals.leaseStartDate && { leaseStartDate: new Date(optionals.leaseStartDate) }),
        ...(optionals.leaseEndDate && { leaseEndDate: new Date(optionals.leaseEndDate) }),
        ...(optionals.utilityDeposit !== undefined && { utilityDeposit: optionals.utilityDeposit }),
        ...(optionals.keyDeposit !== undefined && { keyDeposit: optionals.keyDeposit }),
        ...(optionals.billingDay !== undefined && { billingDay: optionals.billingDay }),
        ...(optionals.paymentDueDay !== undefined && { paymentDueDay: optionals.paymentDueDay }),
        ...(optionals.lateFeePercent !== undefined && { lateFeePercent: optionals.lateFeePercent }),
        ...(optionals.notes !== undefined && { notes: optionals.notes }),
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: TenancyStatus.DRAFT,
            reason: 'Application submitted',
            changedBy: userId,
          },
        },
      },
      include: {
        listing: { select: { id: true, title: true, slug: true, status: true } },
        owner: { select: { id: true, name: true, email: true } },
        tenant: {
          select: {
            id: true,
            userId: true,
            status: true,
            user: { select: { id: true, email: true, fullName: true, phone: true } },
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
            startDate: true,
            endDate: true,
            signedDate: true,
          },
        },
        deposits: { select: { id: true, type: true, amount: true, status: true, collectedAt: true } },
        statusHistory: {
          select: {
            id: true,
            tenancyId: true,
            fromStatus: true,
            toStatus: true,
            reason: true,
            changedBy: true,
            changedAt: true,
          },
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    // Emit event
    this.eventEmitter.emit(
      'tenancy.created',
      new TenancyCreatedEvent(
        tenancy.id,
        listingId,
        tenantId,
        this.PartnerContext.partnerId,
      ),
    );

    this.logger.log(`Tenancy created: ${tenancy.id} for listing ${listingId}`);

    return this.transformToDetailView(tenancy);
  }

  /**
   * Get tenancy by ID
   */
  async getById(id: string): Promise<TenancyDetailView> {
    const tenancy = await this.tenancyRepository.findById(id);

    if (!tenancy) {
      throw new NotFoundException('Tenancy not found');
    }

    return tenancy;
  }

  /**
   * List tenancies with filtering and pagination
   */
  async list(query: TenancyQueryDto): Promise<TenancyListResult> {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;

    const where: Prisma.TenancyWhereInput = {};

    // Apply filters
    if (filters.listingId) where.listingId = filters.listingId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.status) where.status = filters.status;
    if (filters.statuses) where.status = { in: filters.statuses };

    // Date filters
    if (filters.leaseEndBefore || filters.leaseEndAfter) {
      where.leaseEndDate = {};
      if (filters.leaseEndBefore) where.leaseEndDate.lte = new Date(filters.leaseEndBefore);
      if (filters.leaseEndAfter) where.leaseEndDate.gte = new Date(filters.leaseEndAfter);
    }

    // Search
    if (filters.search) {
      where.OR = [
        { listing: { title: { contains: filters.search, mode: 'insensitive' } } },
        { tenant: { user: { fullName: { contains: filters.search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const { items, total } = await this.tenancyRepository.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * List tenancies for a specific tenant
   */
  async listByTenant(tenantId: string): Promise<TenancyView[]> {
    return this.tenancyRepository.findByTenantId(tenantId);
  }

  /**
   * List tenancies for a specific owner (vendor)
   */
  async listByOwner(ownerId: string): Promise<TenancyView[]> {
    return this.tenancyRepository.findByOwnerId(ownerId);
  }

  /**
   * Update tenancy details (non-status fields)
   */
  async update(id: string, dto: UpdateTenancyDto, userId: string): Promise<TenancyView> {
    const tenancy = await this.tenancyRepository.findByIdSimple(id);

    if (!tenancy) {
      throw new NotFoundException('Tenancy not found');
    }

    // Cannot update financial terms after ACTIVE
    const immutableStatuses: TenancyStatus[] = [TenancyStatus.ACTIVE, TenancyStatus.TERMINATED, TenancyStatus.EXTENDED];
    const immutableAfterActive = ['monthlyRent', 'securityDeposit'];
    if (immutableStatuses.includes(tenancy.status)) {
      for (const field of immutableAfterActive) {
        if (dto[field as keyof UpdateTenancyDto] !== undefined) {
          throw new BadRequestException(
            `Cannot update ${field} after tenancy is active`,
          );
        }
      }
    }

    return this.tenancyRepository.update(id, this.mapDtoToData(dto));
  }

  /**
   * Get tenancy status history
   */
  async getStatusHistory(id: string): Promise<TenancyStatusHistoryView[]> {
    const tenancy = await this.tenancyRepository.findByIdSimple(id);

    if (!tenancy) {
      throw new NotFoundException('Tenancy not found');
    }

    return this.tenancyRepository.getStatusHistory(id);
  }

  // =========================
  // WORKFLOW TRANSITIONS
  // =========================

  /**
   * Confirm booking (DRAFT → BOOKED)
   */
  async confirmBooking(
    id: string,
    dto: ConfirmBookingDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    return this.executeTransition(id, 'confirm_booking', userId, dto.reason, {
      moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : undefined,
      leaseStartDate: dto.leaseStartDate ? new Date(dto.leaseStartDate) : undefined,
      leaseEndDate: dto.leaseEndDate ? new Date(dto.leaseEndDate) : undefined,
    });
  }

  /**
   * Confirm deposit payment (BOOKED → DEPOSIT_PAID)
   */
  async confirmDeposit(
    id: string,
    dto: ConfirmDepositDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    const reason = dto.paymentReference
      ? `Deposit confirmed. Reference: ${dto.paymentReference}`
      : dto.reason || 'Deposit confirmed';

    return this.executeTransition(id, 'confirm_deposit', userId, reason);
  }

  /**
   * Submit contract (DEPOSIT_PAID → CONTRACT_PENDING)
   */
  async submitContract(
    id: string,
    dto: TransitionTenancyDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    return this.executeTransition(
      id,
      'submit_contract',
      userId,
      dto.reason || 'Contract ready for signing',
    );
  }

  /**
   * Activate tenancy (CONTRACT_PENDING → ACTIVE)
   */
  async activate(
    id: string,
    dto: TransitionTenancyDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    return this.executeTransition(
      id,
      'activate',
      userId,
      dto.reason || 'Contract signed, tenancy activated',
    );
  }

  /**
   * Request termination (ACTIVE → TERMINATION_REQUESTED)
   */
  async requestTermination(
    id: string,
    dto: RequestTerminationDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    const reason = dto.terminationReason || dto.reason || 'Termination requested';

    return this.executeTransition(id, 'request_termination', userId, reason, {
      moveOutDate: new Date(dto.requestedMoveOutDate),
    });
  }

  /**
   * Complete termination (TERMINATION_REQUESTED → TERMINATED)
   */
  async terminate(
    id: string,
    dto: TerminateTenancyDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    const reason = dto.inspectionNotes || dto.reason || 'Tenancy terminated';

    return this.executeTransition(id, 'terminate', userId, reason, {
      actualEndDate: dto.actualMoveOutDate ? new Date(dto.actualMoveOutDate) : new Date(),
    });
  }

  /**
   * Extend tenancy (ACTIVE → EXTENDED)
   */
  async extend(
    id: string,
    dto: ExtendTenancyDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    const reason = dto.extensionNotes || dto.reason || 'Lease extended';

    const updateData: Prisma.TenancyUncheckedUpdateInput = {
      leaseEndDate: new Date(dto.newLeaseEndDate),
    };

    if (dto.newMonthlyRent) {
      updateData.monthlyRent = dto.newMonthlyRent;
    }

    return this.executeTransition(id, 'extend', userId, reason, updateData);
  }

  /**
   * Cancel tenancy (DRAFT/BOOKED → TERMINATED)
   */
  async cancel(
    id: string,
    dto: TransitionTenancyDto,
    userId: string,
  ): Promise<TenancyDetailView> {
    return this.executeTransition(
      id,
      'cancel',
      userId,
      dto.reason || 'Tenancy cancelled',
    );
  }

  // =========================
  // HELPER METHODS
  // =========================

  /**
   * Execute a state transition
   */
  private async executeTransition(
    id: string,
    event: TenancyEvent,
    userId: string,
    reason?: string,
    additionalData?: Prisma.TenancyUncheckedUpdateInput,
  ): Promise<TenancyDetailView> {
    const tenancy = await this.tenancyRepository.findByIdSimple(id);

    if (!tenancy) {
      throw new NotFoundException('Tenancy not found');
    }

    // Check if transition is valid
    const result = await this.tenancyStateMachine.transition(
      tenancy.status,
      event,
      { tenancyId: id, userId },
    );

    if (!result.success) {
      throw new BadRequestException(
        result.error || `Cannot perform ${event} from status ${tenancy.status}`,
      );
    }

    // Update status with history
    const updated = await this.tenancyRepository.updateStatus(
      id,
      tenancy.status,
      result.toState,
      userId,
      reason,
      additionalData,
    );

    // Emit appropriate event
    this.emitTransitionEvent(event, updated.id, tenancy.status, result.toState, reason, userId);

    this.logger.log(
      `Tenancy ${id} transitioned: ${tenancy.status} → ${result.toState} (${event})`,
    );

    return updated;
  }

  /**
   * Emit domain event based on transition type
   */
  private emitTransitionEvent(
    event: TenancyEvent,
    tenancyId: string,
    fromStatus: TenancyStatus | null,
    toStatus: TenancyStatus,
    reason: string | null | undefined,
    changedBy: string,
  ): void {
    const partnerId = this.PartnerContext.partnerId;

    const baseEvent = new TenancyStatusChangedEvent(
      tenancyId,
      fromStatus,
      toStatus,
      reason || null,
      changedBy,
      partnerId,
    );

    // Always emit generic status changed event
    this.eventEmitter.emit('tenancy.status.changed', baseEvent);

    // Emit specific events for key transitions
    switch (event) {
      case 'confirm_booking':
        this.eventEmitter.emit('tenancy.booked', new TenancyBookedEvent(
          tenancyId, fromStatus, toStatus, reason || null, changedBy, partnerId,
        ));
        break;
      case 'activate':
        this.eventEmitter.emit('tenancy.activated', new TenancyActivatedEvent(
          tenancyId, fromStatus, toStatus, reason || null, changedBy, partnerId,
        ));
        break;
      case 'terminate':
      case 'cancel':
        this.eventEmitter.emit('tenancy.terminated', new TenancyTerminatedEvent(
          tenancyId, fromStatus, toStatus, reason || null, changedBy, partnerId,
        ));
        break;
      case 'extend':
        this.eventEmitter.emit('tenancy.extended', new TenancyExtendedEvent(
          tenancyId, fromStatus, toStatus, reason || null, changedBy, partnerId,
        ));
        break;
    }
  }

  /**
   * Map DTO fields to Prisma create data 
   * Returns only the optional fields that can be spread into create
   */
  private mapDtoToCreateData(
    dto: Partial<CreateTenancyDto>,
  ): Partial<{
    moveInDate: Date;
    leaseStartDate: Date;
    leaseEndDate: Date;
    monthlyRent: number;
    securityDeposit: number;
    utilityDeposit: number;
    keyDeposit: number;
    billingDay: number;
    paymentDueDay: number;
    lateFeePercent: number;
    notes: string;
  }> {
    const data: ReturnType<typeof this.mapDtoToCreateData> = {};

    if (dto.moveInDate) data.moveInDate = new Date(dto.moveInDate);
    if (dto.leaseStartDate) data.leaseStartDate = new Date(dto.leaseStartDate);
    if (dto.leaseEndDate) data.leaseEndDate = new Date(dto.leaseEndDate);
    if (dto.monthlyRent !== undefined) data.monthlyRent = dto.monthlyRent;
    if (dto.securityDeposit !== undefined) data.securityDeposit = dto.securityDeposit;
    if (dto.utilityDeposit !== undefined) data.utilityDeposit = dto.utilityDeposit;
    if (dto.keyDeposit !== undefined) data.keyDeposit = dto.keyDeposit;
    if (dto.billingDay !== undefined) data.billingDay = dto.billingDay;
    if (dto.paymentDueDay !== undefined) data.paymentDueDay = dto.paymentDueDay;
    if (dto.lateFeePercent !== undefined) data.lateFeePercent = dto.lateFeePercent;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return data;
  }

  /**
   * Map DTO fields to Prisma data
   */
  private mapDtoToData(
    dto: Partial<CreateTenancyDto | UpdateTenancyDto>,
  ): Prisma.TenancyUncheckedUpdateInput {
    const data: Prisma.TenancyUncheckedUpdateInput = {};

    if (dto.moveInDate) data.moveInDate = new Date(dto.moveInDate);
    if ((dto as UpdateTenancyDto).moveOutDate) data.moveOutDate = new Date((dto as UpdateTenancyDto).moveOutDate!);
    if (dto.leaseStartDate) data.leaseStartDate = new Date(dto.leaseStartDate);
    if (dto.leaseEndDate) data.leaseEndDate = new Date(dto.leaseEndDate);
    if (dto.monthlyRent !== undefined) data.monthlyRent = dto.monthlyRent;
    if (dto.securityDeposit !== undefined) data.securityDeposit = dto.securityDeposit;
    if (dto.utilityDeposit !== undefined) data.utilityDeposit = dto.utilityDeposit;
    if (dto.keyDeposit !== undefined) data.keyDeposit = dto.keyDeposit;
    if (dto.billingDay !== undefined) data.billingDay = dto.billingDay;
    if (dto.paymentDueDay !== undefined) data.paymentDueDay = dto.paymentDueDay;
    if (dto.lateFeePercent !== undefined) data.lateFeePercent = dto.lateFeePercent;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return data;
  }

  /**
   * Transform Prisma result to TenancyDetailView
   */
  private transformToDetailView(tenancy: any): TenancyDetailView {
    return {
      id: tenancy.id,
      partnerId: tenancy.partnerId,
      listingId: tenancy.listingId,
      ownerId: tenancy.ownerId,
      tenantId: tenancy.tenantId,
      status: tenancy.status,
      applicationDate: tenancy.applicationDate,
      moveInDate: tenancy.moveInDate,
      moveOutDate: tenancy.moveOutDate,
      leaseStartDate: tenancy.leaseStartDate,
      leaseEndDate: tenancy.leaseEndDate,
      actualEndDate: tenancy.actualEndDate,
      monthlyRent: tenancy.monthlyRent ? Number(tenancy.monthlyRent) : 0,
      securityDeposit: tenancy.securityDeposit ? Number(tenancy.securityDeposit) : 0,
      utilityDeposit: tenancy.utilityDeposit ? Number(tenancy.utilityDeposit) : null,
      keyDeposit: tenancy.keyDeposit ? Number(tenancy.keyDeposit) : null,
      billingDay: tenancy.billingDay,
      paymentDueDay: tenancy.paymentDueDay,
      lateFeePercent: tenancy.lateFeePercent ? Number(tenancy.lateFeePercent) : null,
      notes: tenancy.notes,
      createdAt: tenancy.createdAt,
      updatedAt: tenancy.updatedAt,
      listing: tenancy.listing,
      owner: tenancy.owner,
      tenant: tenancy.tenant,
      contract: tenancy.contract,
      deposits: tenancy.deposits?.map((d: any) => ({
        ...d,
        amount: d.amount ? Number(d.amount) : 0,
      })) || [],
      statusHistory: tenancy.statusHistory || [],
    };
  }
}
