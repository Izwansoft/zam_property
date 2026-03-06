/**
 * AffiliateService
 * Session 8.4 - Affiliate Module
 *
 * Manages affiliate registration, referral tracking, earnings calculation,
 * and payout processing.
 *
 * Referral types:
 * - OWNER_REGISTRATION: Affiliate refers a new property owner (vendor)
 * - TENANT_BOOKING: Affiliate refers a partner who books a tenancy
 * - AGENT_SIGNUP: Affiliate refers a new agent signup
 *
 * Commission rates (configurable defaults):
 * - OWNER_REGISTRATION: RM 200 flat
 * - TENANT_BOOKING: 5% of first month rent
 * - AGENT_SIGNUP: RM 100 flat
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  AffiliateStatus,
  AffiliatePayoutStatus,
  ReferralStatus,
  ReferralType,
  Prisma,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  CreateAffiliateDto,
  UpdateAffiliateDto,
  TrackReferralDto,
  AffiliateQueryDto,
  ReferralQueryDto,
  ProcessPayoutDto,
} from './dto';

// ============================================
// VIEW INTERFACES
// ============================================

export interface AffiliateView {
  id: string;
  partnerId: string;
  userId: string;
  code: string;
  type: string;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  totalReferrals: number;
  totalEarnings: any; // Decimal
  unpaidEarnings: any; // Decimal
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ReferralView {
  id: string;
  affiliateId: string;
  referralType: string;
  referredId: string;
  commissionRate: any; // Decimal
  commissionAmount: any; // Decimal
  status: string;
  confirmedAt: Date | null;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface AffiliateListResult {
  data: AffiliateView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReferralListResult {
  data: ReferralView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EarningsSummary {
  totalEarnings: any; // Decimal
  unpaidEarnings: any; // Decimal
  pendingReferrals: number;
  confirmedReferrals: number;
  paidReferrals: number;
  byType: {
    type: string;
    count: number;
    totalAmount: any;
  }[];
}

export interface PayoutView {
  id: string;
  affiliateId: string;
  amount: any; // Decimal
  status: string;
  processedAt: Date | null;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

// ============================================
// DEFAULT COMMISSION RATES
// ============================================

const DEFAULT_COMMISSION_RATES: Record<ReferralType, { rate: number; flatAmount: number }> = {
  OWNER_REGISTRATION: { rate: 0, flatAmount: 200.00 },
  TENANT_BOOKING: { rate: 5.00, flatAmount: 0 },
  AGENT_SIGNUP: { rate: 0, flatAmount: 100.00 },
};

// ============================================
// AFFILIATE CODE GENERATION
// ============================================

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = 'REF';
  let code = prefix;
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// SERVICE
// ============================================

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // CREATE AFFILIATE (generateCode)
  // ============================================

  async createAffiliate(dto: CreateAffiliateDto): Promise<AffiliateView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    // Verify user exists in partner
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, partnerId },
    });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    // Check if user is already an affiliate
    const existing = await this.prisma.affiliate.findUnique({
      where: { partnerId_userId: { partnerId, userId: dto.userId } },
    });
    if (existing) {
      throw new ConflictException(`User ${dto.userId} is already registered as affiliate ${existing.code}`);
    }

    // Generate unique code
    let code = generateAffiliateCode();
    let attempts = 0;
    while (attempts < 10) {
      const codeExists = await this.prisma.affiliate.findUnique({ where: { code } });
      if (!codeExists) break;
      code = generateAffiliateCode();
      attempts++;
    }

    const affiliate = await this.prisma.affiliate.create({
      data: {
        partnerId,
        userId: dto.userId,
        code,
        type: dto.type ?? 'INDIVIDUAL',
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
        bankAccountName: dto.bankAccountName,
        notes: dto.notes,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    this.logger.log(`Affiliate created: ${affiliate.code} for user ${dto.userId}`);
    this.eventEmitter.emit('affiliate.created', {
      affiliateId: affiliate.id,
      code: affiliate.code,
      userId: dto.userId,
      partnerId,
    });

    return affiliate as AffiliateView;
  }

  // ============================================
  // GET AFFILIATE
  // ============================================

  async getAffiliate(affiliateId: string): Promise<AffiliateView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, partnerId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${affiliateId} not found`);
    }
    return affiliate as AffiliateView;
  }

  // ============================================
  // GET AFFILIATE BY CODE
  // ============================================

  async getAffiliateByCode(code: string): Promise<AffiliateView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const affiliate = await this.prisma.affiliate.findFirst({
      where: { code, partnerId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate with code ${code} not found`);
    }
    return affiliate as AffiliateView;
  }

  // ============================================
  // LIST AFFILIATES
  // ============================================

  async listAffiliates(query: AffiliateQueryDto): Promise<AffiliateListResult> {
    const partnerId = this.PartnerContext.getContext().partnerId;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateWhereInput = { partnerId };
    if (query.status) where.status = query.status;

    const orderBy: Prisma.AffiliateOrderByWithRelationInput = {};
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';
    if (sortBy === 'totalEarnings') orderBy.totalEarnings = sortDir;
    else if (sortBy === 'totalReferrals') orderBy.totalReferrals = sortDir;
    else orderBy.createdAt = sortDir;

    const [data, total] = await Promise.all([
      this.prisma.affiliate.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.affiliate.count({ where }),
    ]);

    return {
      data: data as AffiliateView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // UPDATE AFFILIATE
  // ============================================

  async updateAffiliate(affiliateId: string, dto: UpdateAffiliateDto): Promise<AffiliateView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, partnerId },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${affiliateId} not found`);
    }

    const updated = await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        type: dto.type,
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
        bankAccountName: dto.bankAccountName,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    return updated as AffiliateView;
  }

  // ============================================
  // DEACTIVATE AFFILIATE
  // ============================================

  async deactivateAffiliate(affiliateId: string): Promise<AffiliateView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, partnerId },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${affiliateId} not found`);
    }
    if (affiliate.status === AffiliateStatus.INACTIVE) {
      throw new BadRequestException('Affiliate is already inactive');
    }

    const updated = await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: { status: AffiliateStatus.INACTIVE },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    this.eventEmitter.emit('affiliate.deactivated', {
      affiliateId,
      partnerId,
    });

    return updated as AffiliateView;
  }

  // ============================================
  // TRACK REFERRAL
  // ============================================

  async trackReferral(dto: TrackReferralDto): Promise<ReferralView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    // Verify affiliate exists and is active
    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: dto.affiliateId, partnerId },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${dto.affiliateId} not found`);
    }
    if (affiliate.status !== AffiliateStatus.ACTIVE) {
      throw new BadRequestException('Affiliate is not active');
    }

    // Check for duplicate referral (same affiliate + same referredId)
    const existingReferral = await this.prisma.affiliateReferral.findFirst({
      where: {
        affiliateId: dto.affiliateId,
        referredId: dto.referredId,
      },
    });
    if (existingReferral) {
      throw new ConflictException(`Referral already exists for this entity`);
    }

    // Calculate commission
    const defaults = DEFAULT_COMMISSION_RATES[dto.referralType];
    const commissionRate = dto.commissionRate ?? defaults.rate;
    let commissionAmount: number;

    if (dto.commissionAmount !== undefined) {
      commissionAmount = dto.commissionAmount;
    } else if (defaults.flatAmount > 0) {
      commissionAmount = defaults.flatAmount;
    } else {
      // For percentage-based (TENANT_BOOKING), try to get the tenancy monthlyRent
      commissionAmount = await this.calculateReferralAmount(dto.referralType, dto.referredId, commissionRate);
    }

    const referral = await this.prisma.affiliateReferral.create({
      data: {
        affiliateId: dto.affiliateId,
        referralType: dto.referralType,
        referredId: dto.referredId,
        commissionRate,
        commissionAmount,
        notes: dto.notes,
      },
    });

    // Update affiliate stats
    await this.prisma.affiliate.update({
      where: { id: dto.affiliateId },
      data: {
        totalReferrals: { increment: 1 },
      },
    });

    this.logger.log(`Referral tracked: ${referral.id} type=${dto.referralType} affiliate=${dto.affiliateId}`);
    this.eventEmitter.emit('affiliate.referral.created', {
      referralId: referral.id,
      affiliateId: dto.affiliateId,
      referralType: dto.referralType,
      referredId: dto.referredId,
      commissionAmount,
      partnerId,
    });

    return referral as ReferralView;
  }

  // ============================================
  // CONFIRM REFERRAL
  // ============================================

  async confirmReferral(referralId: string): Promise<ReferralView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const referral = await this.prisma.affiliateReferral.findFirst({
      where: {
        id: referralId,
        affiliate: { partnerId },
      },
    });
    if (!referral) {
      throw new NotFoundException(`Referral ${referralId} not found`);
    }
    if (referral.status !== ReferralStatus.PENDING) {
      throw new BadRequestException(`Cannot confirm referral in ${referral.status} status`);
    }

    const updated = await this.prisma.affiliateReferral.update({
      where: { id: referralId },
      data: {
        status: ReferralStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    // Update affiliate unpaid earnings
    await this.prisma.affiliate.update({
      where: { id: referral.affiliateId },
      data: {
        unpaidEarnings: { increment: Number(referral.commissionAmount) },
        totalEarnings: { increment: Number(referral.commissionAmount) },
      },
    });

    this.eventEmitter.emit('affiliate.referral.confirmed', {
      referralId,
      affiliateId: referral.affiliateId,
      commissionAmount: referral.commissionAmount,
      partnerId,
    });

    return updated as ReferralView;
  }

  // ============================================
  // LIST REFERRALS
  // ============================================

  async listReferrals(affiliateId: string, query: ReferralQueryDto): Promise<ReferralListResult> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    // Verify affiliate exists in partner
    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, partnerId },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${affiliateId} not found`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateReferralWhereInput = { affiliateId };
    if (query.referralType) where.referralType = query.referralType;
    if (query.status) where.status = query.status;

    const orderBy: Prisma.AffiliateReferralOrderByWithRelationInput = {};
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';
    if (sortBy === 'commissionAmount') orderBy.commissionAmount = sortDir;
    else orderBy.createdAt = sortDir;

    const [data, total] = await Promise.all([
      this.prisma.affiliateReferral.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.affiliateReferral.count({ where }),
    ]);

    return {
      data: data as ReferralView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // CALCULATE EARNINGS (Summary)
  // ============================================

  async calculateEarnings(affiliateId: string): Promise<EarningsSummary> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, partnerId },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${affiliateId} not found`);
    }

    // Get counts by status
    const [pendingCount, confirmedCount, paidCount] = await Promise.all([
      this.prisma.affiliateReferral.count({
        where: { affiliateId, status: ReferralStatus.PENDING },
      }),
      this.prisma.affiliateReferral.count({
        where: { affiliateId, status: ReferralStatus.CONFIRMED },
      }),
      this.prisma.affiliateReferral.count({
        where: { affiliateId, status: ReferralStatus.PAID },
      }),
    ]);

    // Get earnings by type
    const referralsByType = await this.prisma.affiliateReferral.groupBy({
      by: ['referralType'],
      where: {
        affiliateId,
        status: { in: [ReferralStatus.CONFIRMED, ReferralStatus.PAID] },
      },
      _count: true,
      _sum: { commissionAmount: true },
    });

    const byType = referralsByType.map((r) => ({
      type: r.referralType,
      count: r._count,
      totalAmount: r._sum.commissionAmount ?? 0,
    }));

    return {
      totalEarnings: affiliate.totalEarnings,
      unpaidEarnings: affiliate.unpaidEarnings,
      pendingReferrals: pendingCount,
      confirmedReferrals: confirmedCount,
      paidReferrals: paidCount,
      byType,
    };
  }

  // ============================================
  // PROCESS PAYOUT
  // ============================================

  async processPayout(affiliateId: string, dto?: ProcessPayoutDto): Promise<PayoutView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, partnerId },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${affiliateId} not found`);
    }

    const unpaid = Number(affiliate.unpaidEarnings);
    if (unpaid <= 0) {
      throw new BadRequestException('No unpaid earnings to process');
    }

    // Create payout record
    const payout = await this.prisma.affiliatePayout.create({
      data: {
        affiliateId,
        amount: unpaid,
        status: AffiliatePayoutStatus.PROCESSING,
        reference: dto?.reference,
        notes: dto?.notes,
      },
    });

    // Mark confirmed referrals as PAID
    await this.prisma.affiliateReferral.updateMany({
      where: {
        affiliateId,
        status: ReferralStatus.CONFIRMED,
      },
      data: {
        status: ReferralStatus.PAID,
        paidAt: new Date(),
      },
    });

    // Reset unpaid earnings
    await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data: { unpaidEarnings: 0 },
    });

    this.logger.log(`Payout created: ${payout.id} amount=${unpaid} affiliate=${affiliateId}`);
    this.eventEmitter.emit('affiliate.payout.created', {
      payoutId: payout.id,
      affiliateId,
      amount: unpaid,
      partnerId,
    });

    return payout as PayoutView;
  }

  // ============================================
  // COMPLETE PAYOUT
  // ============================================

  async completePayout(payoutId: string, dto?: ProcessPayoutDto): Promise<PayoutView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const payout = await this.prisma.affiliatePayout.findFirst({
      where: {
        id: payoutId,
        affiliate: { partnerId },
      },
    });
    if (!payout) {
      throw new NotFoundException(`Payout ${payoutId} not found`);
    }
    if (payout.status !== AffiliatePayoutStatus.PROCESSING) {
      throw new BadRequestException(`Cannot complete payout in ${payout.status} status`);
    }

    const updated = await this.prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: AffiliatePayoutStatus.COMPLETED,
        processedAt: new Date(),
        reference: dto?.reference ?? payout.reference,
        notes: dto?.notes ? `${payout.notes ? payout.notes + '\n' : ''}${dto.notes}` : payout.notes,
      },
    });

    this.eventEmitter.emit('affiliate.payout.completed', {
      payoutId,
      affiliateId: payout.affiliateId,
      amount: payout.amount,
      partnerId,
    });

    return updated as PayoutView;
  }

  // ============================================
  // LIST PAYOUTS
  // ============================================

  async listPayouts(affiliateId: string): Promise<PayoutView[]> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const affiliate = await this.prisma.affiliate.findFirst({
      where: { id: affiliateId, partnerId },
    });
    if (!affiliate) {
      throw new NotFoundException(`Affiliate ${affiliateId} not found`);
    }

    const payouts = await this.prisma.affiliatePayout.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });

    return payouts as PayoutView[];
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * When a vendor registers via a referral code, auto-track an OWNER_REGISTRATION referral.
   */
  @OnEvent('vendor.approved')
  async handleVendorApproved(payload: { vendorId: string; referralCode?: string; partnerId: string }) {
    if (!payload.referralCode) return;

    try {
      const affiliate = await this.prisma.affiliate.findFirst({
        where: { code: payload.referralCode, partnerId: payload.partnerId, status: AffiliateStatus.ACTIVE },
      });
      if (!affiliate) return;

      // Check if already tracked
      const existing = await this.prisma.affiliateReferral.findFirst({
        where: { affiliateId: affiliate.id, referredId: payload.vendorId },
      });
      if (existing) return;

      const defaults = DEFAULT_COMMISSION_RATES.OWNER_REGISTRATION;
      await this.prisma.affiliateReferral.create({
        data: {
          affiliateId: affiliate.id,
          referralType: ReferralType.OWNER_REGISTRATION,
          referredId: payload.vendorId,
          commissionRate: defaults.rate,
          commissionAmount: defaults.flatAmount,
        },
      });

      await this.prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { totalReferrals: { increment: 1 } },
      });

      this.logger.log(`Auto-tracked OWNER_REGISTRATION referral for vendor ${payload.vendorId}`);
    } catch (error) {
      this.logger.error(`Failed to auto-track vendor referral: ${error}`);
    }
  }

  /**
   * When a tenancy becomes active via a referral code, auto-track a TENANT_BOOKING referral.
   */
  @OnEvent('tenancy.activated')
  async handleTenancyActivated(payload: { tenancyId: string; referralCode?: string; partnerId: string }) {
    if (!payload.referralCode) return;

    try {
      const affiliate = await this.prisma.affiliate.findFirst({
        where: { code: payload.referralCode, partnerId: payload.partnerId, status: AffiliateStatus.ACTIVE },
      });
      if (!affiliate) return;

      // Check if already tracked
      const existing = await this.prisma.affiliateReferral.findFirst({
        where: { affiliateId: affiliate.id, referredId: payload.tenancyId },
      });
      if (existing) return;

      // Get tenancy for commission calculation
      const tenancy = await this.prisma.tenancy.findUnique({
        where: { id: payload.tenancyId },
        select: { monthlyRent: true },
      });
      if (!tenancy) return;

      const defaults = DEFAULT_COMMISSION_RATES.TENANT_BOOKING;
      const commissionAmount = Number(tenancy.monthlyRent) * (defaults.rate / 100);

      await this.prisma.affiliateReferral.create({
        data: {
          affiliateId: affiliate.id,
          referralType: ReferralType.TENANT_BOOKING,
          referredId: payload.tenancyId,
          commissionRate: defaults.rate,
          commissionAmount,
        },
      });

      await this.prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { totalReferrals: { increment: 1 } },
      });

      this.logger.log(`Auto-tracked TENANT_BOOKING referral for tenancy ${payload.tenancyId}`);
    } catch (error) {
      this.logger.error(`Failed to auto-track tenancy referral: ${error}`);
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Calculate referral commission amount based on type.
   * For TENANT_BOOKING: percentage of monthly rent.
   * For others: flat amount from defaults.
   */
  private async calculateReferralAmount(
    type: ReferralType,
    referredId: string,
    rate: number,
  ): Promise<number> {
    if (type === ReferralType.TENANT_BOOKING) {
      const tenancy = await this.prisma.tenancy.findUnique({
        where: { id: referredId },
        select: { monthlyRent: true },
      });
      if (tenancy) {
        return Number(tenancy.monthlyRent) * (rate / 100);
      }
    }

    // Default flat amount fallback
    const defaults = DEFAULT_COMMISSION_RATES[type];
    return defaults.flatAmount;
  }
}
