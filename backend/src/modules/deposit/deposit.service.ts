import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Deposit, DepositStatus, TenancyStatus, ClaimStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';

import {
  CreateDepositDto,
  CreateDepositsFromTenancyDto,
  CollectDepositDto,
  ProcessRefundDto,
  AddDeductionDto,
  ForfeitDepositDto,
  DepositQueryDto,
  FinalizeDepositDto,
  DepositType,
} from './dto';

/**
 * View type for deposit with relations
 */
export interface DepositView extends Deposit {
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
}

/**
 * Deduction claim entry
 */
export interface DeductionClaim {
  claimId?: string;
  description: string;
  amount: number;
  addedAt: Date;
}

/**
 * Event emitted when deposit is created
 */
export class DepositCreatedEvent {
  constructor(
    public readonly depositId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly type: string,
    public readonly amount: number,
  ) {}
}

/**
 * Event emitted when deposit is collected
 */
export class DepositCollectedEvent {
  constructor(
    public readonly depositId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly type: string,
    public readonly amount: number,
  ) {}
}

/**
 * Event emitted when deposit is refunded
 */
export class DepositRefundedEvent {
  constructor(
    public readonly depositId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly type: string,
    public readonly refundedAmount: number,
    public readonly deductions: number,
  ) {}
}

/**
 * Event emitted when deposit is finalized (claims applied + refund processed)
 */
export class DepositFinalizedEvent {
  constructor(
    public readonly depositId: string,
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly type: string,
    public readonly originalAmount: number,
    public readonly totalDeductions: number,
    public readonly refundedAmount: number,
    public readonly claimsApplied: number,
  ) {}
}

/**
 * Service for managing tenant deposits (security, utility, key)
 */
@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a single deposit
   */
  async create(dto: CreateDepositDto): Promise<DepositView> {
    const partnerId = this.PartnerContext.partnerId;

    // Verify tenancy exists and belongs to partner
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: dto.tenancyId,
        partnerId,
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy not found: ${dto.tenancyId}`);
    }

    // Check if deposit of this type already exists for the tenancy
    const existingDeposit = await this.prisma.deposit.findFirst({
      where: {
        tenancyId: dto.tenancyId,
        type: dto.type,
      },
    });

    if (existingDeposit) {
      throw new ConflictException(
        `${dto.type} deposit already exists for this tenancy`,
      );
    }

    // Create deposit
    const deposit = await this.prisma.deposit.create({
      data: {
        tenancyId: dto.tenancyId,
        type: dto.type,
        amount: dto.amount,
        status: DepositStatus.PENDING,
      },
      include: this.getDepositInclude(),
    });

    // Emit event
    this.eventEmitter.emit(
      'deposit.created',
      new DepositCreatedEvent(
        deposit.id,
        dto.tenancyId,
        partnerId,
        dto.type,
        dto.amount,
      ),
    );

    this.logger.log(
      `Created ${dto.type} deposit of ${dto.amount} for tenancy ${dto.tenancyId}`,
    );

    return deposit as DepositView;
  }

  /**
   * Create all deposits for a tenancy from tenancy amounts
   */
  async createFromTenancy(dto: CreateDepositsFromTenancyDto): Promise<DepositView[]> {
    const partnerId = this.PartnerContext.partnerId;

    // Get tenancy with amounts
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: dto.tenancyId,
        partnerId,
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy not found: ${dto.tenancyId}`);
    }

    const deposits: DepositView[] = [];

    // Create security deposit if amount > 0
    const securityAmount = dto.securityDeposit ?? Number(tenancy.securityDeposit);
    if (securityAmount > 0) {
      const securityDeposit = await this.create({
        tenancyId: dto.tenancyId,
        type: 'SECURITY',
        amount: securityAmount,
      });
      deposits.push(securityDeposit);
    }

    // Create utility deposit if amount > 0
    const utilityAmount = dto.utilityDeposit ?? (tenancy.utilityDeposit ? Number(tenancy.utilityDeposit) : 0);
    if (utilityAmount > 0) {
      const utilityDeposit = await this.create({
        tenancyId: dto.tenancyId,
        type: 'UTILITY',
        amount: utilityAmount,
      });
      deposits.push(utilityDeposit);
    }

    // Create key deposit if amount > 0
    const keyAmount = dto.keyDeposit ?? (tenancy.keyDeposit ? Number(tenancy.keyDeposit) : 0);
    if (keyAmount > 0) {
      const keyDeposit = await this.create({
        tenancyId: dto.tenancyId,
        type: 'KEY',
        amount: keyAmount,
      });
      deposits.push(keyDeposit);
    }

    this.logger.log(
      `Created ${deposits.length} deposits for tenancy ${dto.tenancyId}`,
    );

    return deposits;
  }

  /**
   * Get deposit by ID
   */
  async findById(id: string): Promise<DepositView> {
    const partnerId = this.PartnerContext.partnerId;

    const deposit = await this.prisma.deposit.findFirst({
      where: {
        id,
        tenancy: { partnerId },
      },
      include: this.getDepositInclude(),
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit not found: ${id}`);
    }

    return deposit as DepositView;
  }

  /**
   * List deposits with filters and pagination
   */
  async findAll(query: DepositQueryDto): Promise<{
    items: DepositView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const partnerId = this.PartnerContext.partnerId;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortDir = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DepositWhereInput = {
      tenancy: {
        partnerId,
        ...(query.ownerId && { ownerId: query.ownerId }),
        ...(query.tenantId && { tenantId: query.tenantId }),
      },
      ...(query.tenancyId && { tenancyId: query.tenancyId }),
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        include: this.getDepositInclude(),
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return {
      items: items as DepositView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all deposits for a tenancy
   */
  async findByTenancyId(tenancyId: string): Promise<DepositView[]> {
    const partnerId = this.PartnerContext.partnerId;

    const deposits = await this.prisma.deposit.findMany({
      where: {
        tenancyId,
        tenancy: { partnerId },
      },
      include: this.getDepositInclude(),
      orderBy: { type: 'asc' },
    });

    return deposits as DepositView[];
  }

  /**
   * Mark deposit as collected
   */
  async markCollected(id: string, dto: CollectDepositDto): Promise<DepositView> {
    const partnerId = this.PartnerContext.partnerId;
    const deposit = await this.findById(id);

    // Validate status
    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException(
        `Cannot collect deposit in ${deposit.status} status. Must be PENDING.`,
      );
    }

    // Update deposit
    const updated = await this.prisma.deposit.update({
      where: { id },
      data: {
        status: DepositStatus.COLLECTED,
        collectedAt: new Date(),
        collectedVia: dto.collectedVia,
        paymentRef: dto.paymentRef,
        refundableAmount: deposit.amount, // Initially fully refundable
      },
      include: this.getDepositInclude(),
    });

    // Emit event
    this.eventEmitter.emit(
      'deposit.collected',
      new DepositCollectedEvent(
        id,
        deposit.tenancyId,
        partnerId,
        deposit.type,
        Number(deposit.amount),
      ),
    );

    this.logger.log(
      `Collected ${deposit.type} deposit ${id}: ${deposit.amount}`,
    );

    return updated as DepositView;
  }

  /**
   * Add a deduction to the deposit
   */
  async addDeduction(id: string, dto: AddDeductionDto): Promise<DepositView> {
    const deposit = await this.findById(id);

    // Validate status - must be COLLECTED or HELD
    const validStatuses: DepositStatus[] = [DepositStatus.COLLECTED, DepositStatus.HELD];
    if (!validStatuses.includes(deposit.status)) {
      throw new BadRequestException(
        `Cannot add deduction to deposit in ${deposit.status} status`,
      );
    }

    // Parse existing deductions
    const existingDeductions: DeductionClaim[] = deposit.deductionClaims
      ? (deposit.deductionClaims as unknown as DeductionClaim[])
      : [];

    // Add new deduction
    const newDeduction: DeductionClaim = {
      claimId: dto.claimId,
      description: dto.description,
      amount: dto.amount,
      addedAt: new Date(),
    };
    existingDeductions.push(newDeduction);

    // Calculate total deductions
    const totalDeductions = existingDeductions.reduce(
      (sum, d) => sum + d.amount,
      0,
    );

    // Validate deductions don't exceed deposit
    if (totalDeductions > Number(deposit.amount)) {
      throw new BadRequestException(
        `Total deductions (${totalDeductions}) cannot exceed deposit amount (${deposit.amount})`,
      );
    }

    // Calculate new refundable amount
    const refundableAmount = Number(deposit.amount) - totalDeductions;

    // Update deposit
    const updated = await this.prisma.deposit.update({
      where: { id },
      data: {
        deductionClaims: existingDeductions as unknown as Prisma.InputJsonValue,
        deductions: totalDeductions,
        refundableAmount: refundableAmount,
        status: DepositStatus.HELD, // Move to HELD when deductions added
      },
      include: this.getDepositInclude(),
    });

    this.logger.log(
      `Added deduction of ${dto.amount} to deposit ${id}. Refundable: ${refundableAmount}`,
    );

    return updated as DepositView;
  }

  /**
   * Calculate refund amount for a deposit
   */
  async calculateRefund(id: string): Promise<{
    depositId: string;
    depositType: string;
    originalAmount: number;
    totalDeductions: number;
    refundableAmount: number;
    deductions: DeductionClaim[];
    canRefund: boolean;
    reason?: string;
  }> {
    const deposit = await this.findById(id);

    // Get deductions
    const deductions: DeductionClaim[] = deposit.deductionClaims
      ? (deposit.deductionClaims as unknown as DeductionClaim[])
      : [];

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const refundableAmount = Number(deposit.amount) - totalDeductions;

    // Check if refund is possible
    let canRefund = true;
    let reason: string | undefined;

    // Must be COLLECTED or HELD
    if (deposit.status !== DepositStatus.COLLECTED && deposit.status !== DepositStatus.HELD) {
      canRefund = false;
      reason = `Deposit is in ${deposit.status} status`;
    }

    // Check if tenancy is terminated (required for refund)
    if (canRefund && deposit.tenancy) {
      const terminatedStatuses: TenancyStatus[] = [TenancyStatus.TERMINATED];
      if (!terminatedStatuses.includes(deposit.tenancy.status)) {
        canRefund = false;
        reason = `Tenancy must be TERMINATED to refund deposit. Current status: ${deposit.tenancy.status}`;
      }
    }

    return {
      depositId: id,
      depositType: deposit.type,
      originalAmount: Number(deposit.amount),
      totalDeductions,
      refundableAmount,
      deductions,
      canRefund,
      reason,
    };
  }

  /**
   * Process refund for a deposit
   */
  async processRefund(id: string, dto: ProcessRefundDto): Promise<DepositView> {
    const partnerId = this.PartnerContext.partnerId;

    // Calculate refund first
    const calculation = await this.calculateRefund(id);

    if (!calculation.canRefund) {
      throw new BadRequestException(
        `Cannot process refund: ${calculation.reason}`,
      );
    }

    const refundAmount = calculation.refundableAmount;
    const isPartialRefund = calculation.totalDeductions > 0;

    // Update deposit
    const updated = await this.prisma.deposit.update({
      where: { id },
      data: {
        status: isPartialRefund
          ? DepositStatus.PARTIALLY_REFUNDED
          : DepositStatus.FULLY_REFUNDED,
        refundedAmount: refundAmount,
        refundedAt: new Date(),
        refundRef: dto.refundRef,
      },
      include: this.getDepositInclude(),
    });

    // Emit event
    this.eventEmitter.emit(
      'deposit.refunded',
      new DepositRefundedEvent(
        id,
        updated.tenancyId,
        partnerId,
        updated.type,
        refundAmount,
        calculation.totalDeductions,
      ),
    );

    this.logger.log(
      `Refunded deposit ${id}: ${refundAmount} (deductions: ${calculation.totalDeductions})`,
    );

    return updated as DepositView;
  }

  /**
   * Forfeit a deposit (e.g., tenant abandoned property)
   */
  async forfeit(id: string, dto: ForfeitDepositDto): Promise<DepositView> {
    const deposit = await this.findById(id);

    // Validate status
    const validStatuses: DepositStatus[] = [DepositStatus.COLLECTED, DepositStatus.HELD];
    if (!validStatuses.includes(deposit.status)) {
      throw new BadRequestException(
        `Cannot forfeit deposit in ${deposit.status} status`,
      );
    }

    // Update deposit
    const updated = await this.prisma.deposit.update({
      where: { id },
      data: {
        status: DepositStatus.FORFEITED,
        refundableAmount: 0,
        deductions: deposit.amount, // Full amount as deduction
        deductionClaims: [
          {
            description: `Forfeited: ${dto.reason}`,
            amount: Number(deposit.amount),
            addedAt: new Date(),
          },
        ] as unknown as Prisma.InputJsonValue,
      },
      include: this.getDepositInclude(),
    });

    this.logger.log(`Forfeited deposit ${id}: ${dto.reason}`);

    return updated as DepositView;
  }

  /**
   * Get deposit summary for a tenancy
   */
  async getTenancyDepositSummary(tenancyId: string): Promise<{
    tenancyId: string;
    totalDeposits: number;
    totalCollected: number;
    totalRefunded: number;
    totalDeductions: number;
    totalPending: number;
    deposits: Array<{
      id: string;
      type: string;
      amount: number;
      status: DepositStatus;
      refundableAmount: number | null;
    }>;
  }> {
    const deposits = await this.findByTenancyId(tenancyId);

    let totalDeposits = 0;
    let totalCollected = 0;
    let totalRefunded = 0;
    let totalDeductions = 0;
    let totalPending = 0;

    const depositSummaries = deposits.map((d) => {
      const amount = Number(d.amount);
      totalDeposits += amount;

      if (d.status === DepositStatus.PENDING) {
        totalPending += amount;
      } else if (
        d.status === DepositStatus.COLLECTED ||
        d.status === DepositStatus.HELD
      ) {
        totalCollected += amount;
        totalDeductions += d.deductions ? Number(d.deductions) : 0;
      } else if (
        d.status === DepositStatus.FULLY_REFUNDED ||
        d.status === DepositStatus.PARTIALLY_REFUNDED
      ) {
        totalRefunded += d.refundedAmount ? Number(d.refundedAmount) : 0;
        totalDeductions += d.deductions ? Number(d.deductions) : 0;
      } else if (d.status === DepositStatus.FORFEITED) {
        totalDeductions += amount;
      }

      return {
        id: d.id,
        type: d.type,
        amount,
        status: d.status,
        refundableAmount: d.refundableAmount ? Number(d.refundableAmount) : null,
      };
    });

    return {
      tenancyId,
      totalDeposits,
      totalCollected,
      totalRefunded,
      totalDeductions,
      totalPending,
      deposits: depositSummaries,
    };
  }

  /**
   * Link an approved/partially approved claim to a deposit as a deduction
   */
  async linkClaimToDeposit(
    depositId: string,
    claimId: string,
  ): Promise<DepositView> {
    const partnerId = this.PartnerContext.partnerId;
    const deposit = await this.findById(depositId);

    // Validate deposit status - must be COLLECTED or HELD
    const validStatuses: DepositStatus[] = [DepositStatus.COLLECTED, DepositStatus.HELD];
    if (!validStatuses.includes(deposit.status)) {
      throw new BadRequestException(
        `Cannot link claim to deposit in ${deposit.status} status`,
      );
    }

    // Fetch the claim
    const claim = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        tenancy: { partnerId },
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim not found: ${claimId}`);
    }

    // Validate claim status - must be APPROVED or PARTIALLY_APPROVED
    if (
      claim.status !== ClaimStatus.APPROVED &&
      claim.status !== ClaimStatus.PARTIALLY_APPROVED
    ) {
      throw new BadRequestException(
        `Cannot link claim in ${claim.status} status. Must be APPROVED or PARTIALLY_APPROVED.`,
      );
    }

    // Validate claim belongs to same tenancy
    if (claim.tenancyId !== deposit.tenancyId) {
      throw new BadRequestException(
        `Claim tenancy (${claim.tenancyId}) does not match deposit tenancy (${deposit.tenancyId})`,
      );
    }

    // Check if claim is already linked to this deposit
    const existingDeductions: DeductionClaim[] = deposit.deductionClaims
      ? (deposit.deductionClaims as unknown as DeductionClaim[])
      : [];

    const alreadyLinked = existingDeductions.some((d) => d.claimId === claimId);
    if (alreadyLinked) {
      throw new ConflictException(
        `Claim ${claimId} is already linked to this deposit`,
      );
    }

    // Use approvedAmount for the deduction
    const deductionAmount = Number(claim.approvedAmount ?? claim.claimedAmount);

    // Add as deduction
    return this.addDeduction(depositId, {
      claimId,
      description: `${claim.type}: ${claim.title} (${claim.claimNumber})`,
      amount: deductionAmount,
    });
  }

  /**
   * Calculate total deductions from approved claims for a tenancy
   */
  async calculateDeductions(tenancyId: string): Promise<{
    tenancyId: string;
    claims: Array<{
      claimId: string;
      claimNumber: string;
      type: string;
      title: string;
      status: string;
      approvedAmount: number;
    }>;
    totalDeductions: number;
    deposits: Array<{
      depositId: string;
      type: string;
      amount: number;
      currentDeductions: number;
      availableForDeduction: number;
    }>;
    shortfall: number;
  }> {
    const partnerId = this.PartnerContext.partnerId;

    // Get all approved/partially approved claims for the tenancy
    const claims = await this.prisma.claim.findMany({
      where: {
        tenancyId,
        tenancy: { partnerId },
        status: {
          in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED],
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    const claimSummaries = claims.map((c) => ({
      claimId: c.id,
      claimNumber: c.claimNumber,
      type: c.type,
      title: c.title,
      status: c.status,
      approvedAmount: Number(c.approvedAmount ?? c.claimedAmount),
    }));

    const totalClaimDeductions = claimSummaries.reduce(
      (sum, c) => sum + c.approvedAmount,
      0,
    );

    // Get all deposits for the tenancy
    const deposits = await this.prisma.deposit.findMany({
      where: {
        tenancyId,
        tenancy: { partnerId },
        status: { in: [DepositStatus.COLLECTED, DepositStatus.HELD] },
      },
      orderBy: { type: 'asc' },
    });

    const depositSummaries = deposits.map((d) => {
      const currentDeductions = d.deductions ? Number(d.deductions) : 0;
      const available = Number(d.amount) - currentDeductions;
      return {
        depositId: d.id,
        type: d.type,
        amount: Number(d.amount),
        currentDeductions,
        availableForDeduction: available,
      };
    });

    const totalAvailable = depositSummaries.reduce(
      (sum, d) => sum + d.availableForDeduction,
      0,
    );

    // Shortfall: if claims exceed available deposits
    const shortfall = Math.max(0, totalClaimDeductions - totalAvailable);

    return {
      tenancyId,
      claims: claimSummaries,
      totalDeductions: totalClaimDeductions,
      deposits: depositSummaries,
      shortfall,
    };
  }

  /**
   * Finalize deposit: apply all approved claims as deductions, mark claims as SETTLED, process refund
   *
   * Flow:
   * 1. Verify tenancy is TERMINATED
   * 2. Get all APPROVED/PARTIALLY_APPROVED claims for the tenancy
   * 3. Link claims to deposits as deductions (security first, then utility, then key)
   * 4. Mark claims as SETTLED with DEPOSIT_DEDUCTION method
   * 5. Process refund of remaining amount
   */
  async finalizeRefund(
    depositId: string,
    dto: FinalizeDepositDto,
    userId: string,
  ): Promise<{
    deposit: DepositView;
    claimsApplied: Array<{
      claimId: string;
      claimNumber: string;
      amount: number;
    }>;
    totalDeductions: number;
    refundedAmount: number;
  }> {
    const partnerId = this.PartnerContext.partnerId;
    const deposit = await this.findById(depositId);

    // Validate deposit status - must be COLLECTED or HELD
    const validStatuses: DepositStatus[] = [DepositStatus.COLLECTED, DepositStatus.HELD];
    if (!validStatuses.includes(deposit.status)) {
      throw new BadRequestException(
        `Cannot finalize deposit in ${deposit.status} status. Must be COLLECTED or HELD.`,
      );
    }

    // Validate tenancy is TERMINATED
    if (!deposit.tenancy || deposit.tenancy.status !== TenancyStatus.TERMINATED) {
      throw new BadRequestException(
        `Tenancy must be TERMINATED to finalize deposit. Current status: ${deposit.tenancy?.status ?? 'unknown'}`,
      );
    }

    // Get all approved claims for this tenancy that are not yet settled
    const approvedClaims = await this.prisma.claim.findMany({
      where: {
        tenancyId: deposit.tenancyId,
        tenancy: { partnerId },
        status: {
          in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED],
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    // Parse existing deductions to find already-linked claims
    const existingDeductions: DeductionClaim[] = deposit.deductionClaims
      ? (deposit.deductionClaims as unknown as DeductionClaim[])
      : [];
    const alreadyLinkedClaimIds = new Set(
      existingDeductions.filter((d) => d.claimId).map((d) => d.claimId),
    );

    // Filter out already-linked claims
    const newClaims = approvedClaims.filter(
      (c) => !alreadyLinkedClaimIds.has(c.id),
    );

    // Apply each new claim as a deduction
    const claimsApplied: Array<{
      claimId: string;
      claimNumber: string;
      amount: number;
    }> = [];

    let currentDeposit = deposit;
    const depositAmount = Number(deposit.amount);
    let runningDeductions = existingDeductions.reduce(
      (sum, d) => sum + d.amount,
      0,
    );

    for (const claim of newClaims) {
      const deductionAmount = Number(claim.approvedAmount ?? claim.claimedAmount);
      const remainingCapacity = depositAmount - runningDeductions;

      if (remainingCapacity <= 0) {
        // Deposit fully consumed — skip remaining claims
        break;
      }

      // Cap deduction to remaining capacity
      const actualDeduction = Math.min(deductionAmount, remainingCapacity);

      // Add deduction entry
      const newDeduction: DeductionClaim = {
        claimId: claim.id,
        description: `${claim.type}: ${claim.title} (${claim.claimNumber})`,
        amount: actualDeduction,
        addedAt: new Date(),
      };
      existingDeductions.push(newDeduction);
      runningDeductions += actualDeduction;

      claimsApplied.push({
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        amount: actualDeduction,
      });

      // Mark claim as SETTLED with DEPOSIT_DEDUCTION
      await this.prisma.claim.update({
        where: { id: claim.id },
        data: {
          status: ClaimStatus.SETTLED,
          settledAt: new Date(),
          settlementMethod: 'DEPOSIT_DEDUCTION',
          reviewNotes: dto.notes
            ? `${claim.reviewNotes ? claim.reviewNotes + '\n' : ''}Finalized: ${dto.notes}`
            : claim.reviewNotes,
        },
      });
    }

    // Calculate totals
    const totalDeductions = runningDeductions;
    const refundableAmount = depositAmount - totalDeductions;
    const isPartialRefund = totalDeductions > 0;

    // Update deposit with all deductions and process refund
    const updatedDeposit = await this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        deductionClaims: existingDeductions as unknown as Prisma.InputJsonValue,
        deductions: totalDeductions,
        refundableAmount: refundableAmount,
        status: refundableAmount > 0
          ? (isPartialRefund ? DepositStatus.PARTIALLY_REFUNDED : DepositStatus.FULLY_REFUNDED)
          : DepositStatus.FORFEITED,
        refundedAmount: refundableAmount > 0 ? refundableAmount : 0,
        refundedAt: new Date(),
        refundRef: dto.refundRef,
      },
      include: this.getDepositInclude(),
    });

    // Emit finalized event
    this.eventEmitter.emit(
      'deposit.finalized',
      new DepositFinalizedEvent(
        depositId,
        deposit.tenancyId,
        partnerId,
        deposit.type,
        depositAmount,
        totalDeductions,
        refundableAmount > 0 ? refundableAmount : 0,
        claimsApplied.length,
      ),
    );

    this.logger.log(
      `Finalized deposit ${depositId}: ${claimsApplied.length} claims applied, ` +
        `deductions=${totalDeductions}, refund=${refundableAmount}`,
    );

    return {
      deposit: updatedDeposit as DepositView,
      claimsApplied,
      totalDeductions,
      refundedAmount: refundableAmount > 0 ? refundableAmount : 0,
    };
  }

  /**
   * Get standard include for deposit queries
   */
  private getDepositInclude() {
    return {
      tenancy: {
        select: {
          id: true,
          status: true,
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    };
  }
}
