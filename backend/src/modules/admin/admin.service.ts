import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, Scope } from '@nestjs/common';
import {
  ClaimStatus,
  DepositStatus,
  InspectionStatus,
  LegalCaseStatus,
  ListingStatus,
  MaintenanceStatus,
  PayoutStatus,
  Role,
  RentBillingStatus,
  ReviewStatus,
  PartnerStatus,
  TenancyStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PartnerContextService } from '@core/partner-context';
import { PrismaService } from '@infrastructure/database';
import { QueueService } from '@infrastructure/queue';
import { JOB_TYPES, QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { RedisService } from '@infrastructure/redis';

import type { ListingQueryDto } from '@modules/listing/dto';
import type { VendorQueryDto } from '@modules/vendor/dto';

import type {
  AdminTenantDetailDto,
  AdminTenantItemDto,
  AdminListingDashboardItemDto,
  AdminSystemHealthDto,
  AdminSystemHealthQueueStatDto,
  AdminVendorDashboardItemDto,
  BulkActionResponseDto,
  BulkExpireListingsRequestDto,
  BulkReindexRequestDto,
  CreatePartnerDto,
  DeactivateTenantDto,
  PropertyManagementStatsDto,
  SuspendTenantDto,
  StatusCountDto,
  PartnerQueryDto,
  PartnerDashboardStatsDto,
  UpdatePartnerSettingsDto,
} from './dto';

@Injectable({ scope: Scope.REQUEST })
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
  ) {}

  async getTenantDashboardStats(): Promise<PartnerDashboardStatsDto> {
    const partnerId = this.PartnerContext.partnerId;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      vendorsByStatusRaw,
      listingsByStatusRaw,
      interactionsByTypeRaw,
      pendingVendors,
      pendingReviews,
    ] = await Promise.all([
      this.prisma.vendor.groupBy({
        by: ['status'],
        where: { partnerId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { partnerId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.interaction.groupBy({
        by: ['interactionType'],
        where: { partnerId, createdAt: { gte: sevenDaysAgo } },
        _count: { _all: true },
      }),
      this.prisma.vendor.count({
        where: { partnerId, deletedAt: null, status: 'PENDING' },
      }),
      this.prisma.review.count({
        where: { partnerId, status: ReviewStatus.PENDING },
      }),
    ]);

    const vendorsByStatus: StatusCountDto[] = vendorsByStatusRaw
      .map((row) => ({ status: String(row.status), count: row._count._all }))
      .sort((a, b) => a.status.localeCompare(b.status));

    const listingsByStatus: StatusCountDto[] = listingsByStatusRaw
      .map((row) => ({ status: String(row.status), count: row._count._all }))
      .sort((a, b) => a.status.localeCompare(b.status));

    const interactionsLast7DaysByType: StatusCountDto[] = interactionsByTypeRaw
      .map((row) => ({ status: String(row.interactionType), count: row._count._all }))
      .sort((a, b) => a.status.localeCompare(b.status));

    return {
      vendorsByStatus,
      listingsByStatus,
      interactionsLast7DaysByType,
      pendingVendors,
      pendingReviews,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROPERTY MANAGEMENT DASHBOARD STATS
  // ─────────────────────────────────────────────────────────────────────────

  async getPropertyManagementStats(): Promise<PropertyManagementStatsDto> {
    const partnerId = this.PartnerContext.partnerId;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Parallel batch 1: groupBy queries ──────────────────────────────────
    const [
      tenancyByStatus,
      billingByStatus,
      maintenanceByStatus,
      maintenanceByPriority,
      payoutByStatus,
      depositByStatus,
      inspectionByStatus,
      claimByStatus,
      legalByStatus,
    ] = await Promise.all([
      this.prisma.tenancy.groupBy({
        by: ['status'],
        where: { partnerId },
        _count: { _all: true },
      }),
      this.prisma.rentBilling.groupBy({
        by: ['status'],
        where: { tenancy: { partnerId } },
        _count: { _all: true },
      }),
      this.prisma.maintenance.groupBy({
        by: ['status'],
        where: { tenancy: { partnerId } },
        _count: { _all: true },
      }),
      this.prisma.maintenance.groupBy({
        by: ['priority'],
        where: { tenancy: { partnerId } },
        _count: { _all: true },
      }),
      this.prisma.ownerPayout.groupBy({
        by: ['status'],
        where: { partnerId },
        _count: { _all: true },
      }),
      this.prisma.deposit.groupBy({
        by: ['status'],
        where: { tenancy: { partnerId } },
        _count: { _all: true },
      }),
      this.prisma.inspection.groupBy({
        by: ['status'],
        where: { tenancy: { partnerId } },
        _count: { _all: true },
      }),
      this.prisma.claim.groupBy({
        by: ['status'],
        where: { tenancy: { partnerId } },
        _count: { _all: true },
      }),
      this.prisma.legalCase.groupBy({
        by: ['status'],
        where: { tenancy: { partnerId } },
        _count: { _all: true },
      }),
    ]);

    // ── Parallel batch 2: aggregates & counts ──────────────────────────────
    const [
      activeTenancies,
      expiringSoonTenancies,
      totalTenancies,
      overdueBillings,
      overdueAmountAgg,
      collectedThisMonthAgg,
      billedThisMonthAgg,
      openMaintenance,
      unassignedMaintenance,
      pendingApprovalPayoutAgg,
      processedPayoutThisMonthAgg,
      heldDepositAgg,
      pendingRefundDeposits,
      upcomingInspections,
      completedInspectionsThisMonth,
      pendingReviewClaims,
      disputedClaims,
      openLegalCases,
      totalTenants,
      activeTenants,
      totalCompanies,
      activeCompanies,
      totalAgents,
      activeAgents,
    ] = await Promise.all([
      // Tenancy counts
      this.prisma.tenancy.count({
        where: { partnerId, status: TenancyStatus.ACTIVE },
      }),
      this.prisma.tenancy.count({
        where: {
          partnerId,
          status: TenancyStatus.ACTIVE,
          leaseEndDate: { lte: thirtyDaysFromNow, gte: now },
        },
      }),
      this.prisma.tenancy.count({ where: { partnerId } }),

      // Billing
      this.prisma.rentBilling.count({
        where: { tenancy: { partnerId }, status: RentBillingStatus.OVERDUE },
      }),
      this.prisma.rentBilling.aggregate({
        where: { tenancy: { partnerId }, status: RentBillingStatus.OVERDUE },
        _sum: { balanceDue: true },
      }),
      this.prisma.rentBilling.aggregate({
        where: {
          tenancy: { partnerId },
          status: RentBillingStatus.PAID,
          paidDate: { gte: startOfMonth },
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.rentBilling.aggregate({
        where: {
          tenancy: { partnerId },
          issueDate: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),

      // Maintenance
      this.prisma.maintenance.count({
        where: {
          tenancy: { partnerId },
          status: { notIn: [MaintenanceStatus.CLOSED, MaintenanceStatus.CANCELLED] },
        },
      }),
      this.prisma.maintenance.count({
        where: {
          tenancy: { partnerId },
          status: { in: [MaintenanceStatus.OPEN, MaintenanceStatus.VERIFIED] },
        },
      }),

      // Payout
      this.prisma.ownerPayout.aggregate({
        where: { partnerId, status: PayoutStatus.CALCULATED },
        _sum: { netPayout: true },
      }),
      this.prisma.ownerPayout.aggregate({
        where: {
          partnerId,
          status: PayoutStatus.COMPLETED,
          updatedAt: { gte: startOfMonth },
        },
        _sum: { netPayout: true },
      }),

      // Deposit
      this.prisma.deposit.aggregate({
        where: {
          tenancy: { partnerId },
          status: { in: [DepositStatus.COLLECTED, DepositStatus.HELD] },
        },
        _sum: { amount: true },
      }),
      this.prisma.deposit.count({
        where: {
          tenancy: { partnerId, status: TenancyStatus.TERMINATED },
          status: DepositStatus.COLLECTED,
        },
      }),

      // Inspection
      this.prisma.inspection.count({
        where: { tenancy: { partnerId }, status: InspectionStatus.SCHEDULED },
      }),
      this.prisma.inspection.count({
        where: {
          tenancy: { partnerId },
          status: InspectionStatus.COMPLETED,
          updatedAt: { gte: startOfMonth },
        },
      }),

      // Claims
      this.prisma.claim.count({
        where: {
          tenancy: { partnerId },
          status: { in: [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW] },
        },
      }),
      this.prisma.claim.count({
        where: { tenancy: { partnerId }, status: ClaimStatus.DISPUTED },
      }),

      // Legal
      this.prisma.legalCase.count({
        where: { tenancy: { partnerId }, status: { not: LegalCaseStatus.CLOSED } },
      }),

      // Tenant
      this.prisma.tenant.count({ where: { partnerId } }),
      this.prisma.tenant.count({
        where: {
          partnerId,
          tenancies: { some: { status: TenancyStatus.ACTIVE } },
        },
      }),

      // Company & Agent
      this.prisma.company.count({ where: { partnerId, deletedAt: null } }),
      this.prisma.company.count({ where: { partnerId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.agent.count({ where: { company: { partnerId } } }),
      this.prisma.agent.count({ where: { company: { partnerId }, status: 'ACTIVE' } }),
    ]);

    // ── Build response ─────────────────────────────────────────────────────
    const toStatusCounts = (raw: Array<{ _count: { _all: number }; [key: string]: unknown }>): StatusCountDto[] => {
      return raw
        .map((row) => {
          const key = Object.keys(row).find((k) => k !== '_count')!;
          return { status: String(row[key]), count: row._count._all };
        })
        .sort((a, b) => a.status.localeCompare(b.status));
    };

    return {
      tenancy: {
        byStatus: toStatusCounts(tenancyByStatus as never[]),
        activeCount: activeTenancies,
        expiringSoonCount: expiringSoonTenancies,
        totalCount: totalTenancies,
      },
      billing: {
        byStatus: toStatusCounts(billingByStatus as never[]),
        overdueCount: overdueBillings,
        overdueAmount: (overdueAmountAgg._sum.balanceDue ?? 0).toString(),
        collectedThisMonth: (collectedThisMonthAgg._sum.paidAmount ?? 0).toString(),
        billedThisMonth: (billedThisMonthAgg._sum.totalAmount ?? 0).toString(),
      },
      maintenance: {
        byStatus: toStatusCounts(maintenanceByStatus as never[]),
        byPriority: toStatusCounts(maintenanceByPriority as never[]),
        openCount: openMaintenance,
        unassignedCount: unassignedMaintenance,
      },
      payout: {
        byStatus: toStatusCounts(payoutByStatus as never[]),
        pendingApprovalAmount: (pendingApprovalPayoutAgg._sum.netPayout ?? 0).toString(),
        processedThisMonth: (processedPayoutThisMonthAgg._sum.netPayout ?? 0).toString(),
      },
      deposit: {
        byStatus: toStatusCounts(depositByStatus as never[]),
        totalHeldAmount: (heldDepositAgg._sum.amount ?? 0).toString(),
        pendingRefundCount: pendingRefundDeposits,
      },
      inspection: {
        byStatus: toStatusCounts(inspectionByStatus as never[]),
        upcomingCount: upcomingInspections,
        completedThisMonth: completedInspectionsThisMonth,
      },
      claim: {
        byStatus: toStatusCounts(claimByStatus as never[]),
        pendingReviewCount: pendingReviewClaims,
        disputedCount: disputedClaims,
      },
      legal: {
        byStatus: toStatusCounts(legalByStatus as never[]),
        openCount: openLegalCases,
      },
      tenant: {
        totalCount: totalTenants,
        activeCount: activeTenants,
      },
      companyAgent: {
        totalCompanies,
        activeCompanies,
        totalAgents,
        activeAgents,
      },
      generatedAt: now.toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE PARTNER
  // ─────────────────────────────────────────────────────────────────────────────

  async createPartner(dto: CreatePartnerDto): Promise<AdminTenantDetailDto> {
    // Validate slug uniqueness
    const existingPartner = await this.prisma.partner.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existingPartner) {
      throw new ConflictException(`Partner with slug '${dto.slug}' already exists`);
    }

    // Validate verticals exist and are active
    let verticalIds: { id: string; type: string }[] = [];
    if (dto.verticalTypes && dto.verticalTypes.length > 0) {
      verticalIds = await this.prisma.verticalDefinition.findMany({
        where: { type: { in: dto.verticalTypes }, isActive: true },
        select: { id: true, type: true },
      });

      const foundTypes = verticalIds.map((v) => v.type);
      const missingTypes = dto.verticalTypes.filter((t) => !foundTypes.includes(t));
      if (missingTypes.length > 0) {
        throw new BadRequestException(
          `Vertical types not found or not active: ${missingTypes.join(', ')}`,
        );
      }
    }

    // Hash admin password
    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    // Create everything in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create partner
      const partner = await tx.partner.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          status: PartnerStatus.ACTIVE,
          enabledVerticals: verticalIds.map((v) => v.type),
          branding: dto.branding ? (dto.branding as Prisma.InputJsonValue) : undefined,
        },
      });

      // 2. Create partner settings
      await tx.partnerSettings.create({
        data: {
          partnerId: partner.id,
          features: {},
        },
      });

      // 3. Create PartnerVertical records
      if (verticalIds.length > 0) {
        await tx.partnerVertical.createMany({
          data: verticalIds.map((v) => ({
            partnerId: partner.id,
            verticalId: v.id,
            isEnabled: true,
          })),
        });
      }

      // 4. Create initial admin user
      const adminUser = await tx.user.create({
        data: {
          partnerId: partner.id,
          email: dto.adminEmail,
          passwordHash,
          fullName: dto.adminName,
          phone: dto.adminPhone ?? null,
          role: Role.PARTNER_ADMIN,
          status: 'ACTIVE',
        },
      });

      return { partner, adminUser };
    });

    this.logger.log(
      `Created partner '${result.partner.name}' (${result.partner.id}) with admin ${result.adminUser.email}`,
    );

    // Return the full detail
    return this.getTenantById(result.partner.id);
  }

  async listTenants(query: PartnerQueryDto): Promise<{
    items: AdminTenantItemDto[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.PartnerWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.plan
        ? {
            subscription: {
              is: {
                plan: {
                  slug: {
                    contains: query.plan.toLowerCase(),
                    mode: 'insensitive',
                  },
                },
              },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              {
                domains: {
                  some: { domain: { contains: query.search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PartnerOrderByWithRelationInput =
      query.sortBy === 'name'
        ? { name: sortOrder }
        : query.sortBy === 'updatedAt'
          ? { updatedAt: sortOrder }
          : query.sortBy === 'vendorCount'
            ? { vendors: { _count: sortOrder } }
            : { createdAt: sortOrder };

    const [tenants, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          enabledVerticals: true,
          branding: true,
          createdAt: true,
          updatedAt: true,
          domains: {
            where: { isPrimary: true },
            select: { domain: true },
            take: 1,
          },
          settings: {
            select: {
              features: true,
            },
          },
          subscription: {
            select: {
              plan: { select: { slug: true, name: true } },
            },
          },
          users: {
            where: { role: Role.PARTNER_ADMIN, deletedAt: null },
            select: { email: true },
            take: 1,
          },
          _count: {
            select: {
              vendors: true,
              listings: true,
            },
          },
        },
      }),
      this.prisma.partner.count({ where }),
    ]);

    const partnerIds = tenants.map((t) => t.id);
    const activeCounts =
      partnerIds.length === 0
        ? []
        : await this.prisma.listing.groupBy({
            by: ['partnerId'],
            where: {
              partnerId: { in: partnerIds },
              deletedAt: null,
              status: ListingStatus.PUBLISHED,
            },
            _count: { _all: true },
          });

    const activeByTenant = new Map(activeCounts.map((c) => [c.partnerId, c._count._all]));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: tenants.map((partner) => ({
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        domain: partner.domains[0]?.domain ?? null,
        status: partner.status,
        logo: this.extractLogo(partner.branding),
        settings: (partner.settings?.features as Record<string, unknown> | undefined) ?? null,
        plan: this.toTenantPlan(partner.subscription?.plan.slug, partner.subscription?.plan.name),
        vendorCount: partner._count.vendors,
        listingCount: partner._count.listings,
        activeListingCount: activeByTenant.get(partner.id) ?? 0,
        adminEmail: partner.users[0]?.email,
        enabledVerticals: partner.enabledVerticals,
        createdAt: partner.createdAt.toISOString(),
        updatedAt: partner.updatedAt.toISOString(),
      })),
      pagination: { page, pageSize, total, totalPages },
    };
  }

  async getTenantById(id: string): Promise<AdminTenantDetailDto> {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        enabledVerticals: true,
        branding: true,
        createdAt: true,
        updatedAt: true,
        domains: {
          where: { isPrimary: true },
          select: { domain: true },
          take: 1,
        },
        settings: {
          select: {
            features: true,
          },
        },
        subscription: {
          select: {
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelledAt: true,
            plan: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
        users: {
          where: { role: Role.PARTNER_ADMIN, deletedAt: null },
          select: { email: true, fullName: true },
          take: 1,
        },
        _count: {
          select: {
            vendors: true,
            listings: true,
          },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    const [activeListingCount, lastListing, lastVendor, lastUser] = await Promise.all([
      this.prisma.listing.count({
        where: { partnerId: partner.id, deletedAt: null, status: ListingStatus.PUBLISHED },
      }),
      this.prisma.listing.findFirst({
        where: { partnerId: partner.id, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.vendor.findFirst({
        where: { partnerId: partner.id, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.user.findFirst({
        where: { partnerId: partner.id, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);

    const settingsFeatures =
      (partner.settings?.features as Record<string, unknown> | undefined) ?? undefined;
    const suspensionReason =
      typeof settingsFeatures?.suspensionReason === 'string'
        ? settingsFeatures.suspensionReason
        : undefined;
    const deactivationReason =
      typeof settingsFeatures?.deactivationReason === 'string'
        ? settingsFeatures.deactivationReason
        : undefined;

    const lastActivityAt = [lastListing?.updatedAt, lastVendor?.updatedAt, lastUser?.updatedAt]
      .filter((date): date is Date => !!date)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      id: partner.id,
      name: partner.name,
      slug: partner.slug,
      domain: partner.domains[0]?.domain ?? null,
      status: partner.status,
      logo: this.extractLogo(partner.branding),
      settings: settingsFeatures ?? null,
      plan: this.toTenantPlan(partner.subscription?.plan.slug, partner.subscription?.plan.name),
      vendorCount: partner._count.vendors,
      listingCount: partner._count.listings,
      activeListingCount,
      enabledVerticals: partner.enabledVerticals,
      adminEmail: partner.users[0]?.email ?? 'N/A',
      adminName: partner.users[0]?.fullName ?? 'Partner Admin',
      subscription: partner.subscription
        ? {
            plan: this.toTenantPlan(partner.subscription.plan.slug, partner.subscription.plan.name),
            status: partner.subscription.status,
            currentPeriodStart: partner.subscription.currentPeriodStart.toISOString(),
            currentPeriodEnd: partner.subscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: !!partner.subscription.cancelledAt,
          }
        : undefined,
      usage: {
        vendorsUsed: partner._count.vendors,
        vendorsLimit: 100,
        listingsUsed: partner._count.listings,
        listingsLimit: 1000,
        storageUsedMB: partner._count.listings * 25,
        storageLimitMB: 10240,
      },
      suspensionReason,
      deactivationReason,
      lastActivityAt: lastActivityAt?.toISOString(),
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
    };
  }

  async suspendTenant(id: string, dto: SuspendTenantDto): Promise<AdminTenantDetailDto> {
    await this.assertTenantExists(id);

    const settings = await this.prisma.partnerSettings.findUnique({ where: { partnerId: id } });
    const previous = (settings?.features as Record<string, unknown> | undefined) ?? {};

    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id },
        data: { status: PartnerStatus.SUSPENDED },
      }),
      this.prisma.partnerSettings.upsert({
        where: { partnerId: id },
        update: {
          features: {
            ...previous,
            suspensionReason: dto.reason,
            statusChangedAt: new Date().toISOString(),
          },
        },
        create: {
          partnerId: id,
          features: {
            suspensionReason: dto.reason,
            statusChangedAt: new Date().toISOString(),
          },
        },
      }),
    ]);

    return this.getTenantById(id);
  }

  async reactivateTenant(id: string): Promise<AdminTenantDetailDto> {
    await this.assertTenantExists(id);

    const settings = await this.prisma.partnerSettings.findUnique({ where: { partnerId: id } });
    const previous = (settings?.features as Record<string, unknown> | undefined) ?? {};

    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id },
        data: { status: PartnerStatus.ACTIVE },
      }),
      this.prisma.partnerSettings.upsert({
        where: { partnerId: id },
        update: {
          features: {
            ...previous,
            suspensionReason: null,
            deactivationReason: null,
            statusChangedAt: new Date().toISOString(),
          },
        },
        create: {
          partnerId: id,
          features: {
            statusChangedAt: new Date().toISOString(),
          },
        },
      }),
    ]);

    return this.getTenantById(id);
  }

  async deactivateTenant(id: string, dto: DeactivateTenantDto): Promise<AdminTenantDetailDto> {
    await this.assertTenantExists(id);

    const settings = await this.prisma.partnerSettings.findUnique({ where: { partnerId: id } });
    const previous = (settings?.features as Record<string, unknown> | undefined) ?? {};

    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id },
        data: { status: PartnerStatus.DEACTIVATED },
      }),
      this.prisma.partnerSettings.upsert({
        where: { partnerId: id },
        update: {
          features: {
            ...previous,
            deactivationReason: dto.reason,
            statusChangedAt: new Date().toISOString(),
          },
        },
        create: {
          partnerId: id,
          features: {
            deactivationReason: dto.reason,
            statusChangedAt: new Date().toISOString(),
          },
        },
      }),
    ]);

    return this.getTenantById(id);
  }

  async updatePartnerSettings(id: string, dto: UpdatePartnerSettingsDto): Promise<AdminTenantDetailDto> {
    await this.assertTenantExists(id);

    if (dto.domain && !dto.domain.includes('.')) {
      throw new BadRequestException('Domain must be a valid hostname');
    }

    await this.prisma.$transaction(async (tx) => {
      if (
        dto.name !== undefined ||
        dto.enabledVerticals !== undefined ||
        dto.logo !== undefined
      ) {
        const existingTenant = await tx.partner.findUnique({
          where: { id },
          select: { branding: true },
        });

        const branding = (existingTenant?.branding as Record<string, unknown> | null) ?? {};

        await tx.partner.update({
          where: { id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.enabledVerticals !== undefined ? { enabledVerticals: dto.enabledVerticals } : {}),
            ...(dto.logo !== undefined
              ? { branding: { ...branding, logoUrl: dto.logo } }
              : {}),
          },
        });
      }

      if (dto.settings !== undefined) {
        const features = dto.settings as Prisma.InputJsonValue;
        await tx.partnerSettings.upsert({
          where: { partnerId: id },
          update: { features },
          create: {
            partnerId: id,
            features,
          },
        });
      }

      if (dto.domain !== undefined) {
        if (dto.domain === null || dto.domain === '') {
          await tx.partnerDomain.deleteMany({ where: { partnerId: id, isPrimary: true } });
        } else {
          const existingPrimary = await tx.partnerDomain.findFirst({
            where: { partnerId: id, isPrimary: true },
            select: { id: true },
          });

          if (existingPrimary) {
            await tx.partnerDomain.update({
              where: { id: existingPrimary.id },
              data: { domain: dto.domain, isPrimary: true },
            });
          } else {
            await tx.partnerDomain.create({
              data: {
                partnerId: id,
                domain: dto.domain,
                isPrimary: true,
                verified: false,
              },
            });
          }
        }
      }
    });

    return this.getTenantById(id);
  }

  async listVendorsDashboard(query: VendorQueryDto): Promise<{
    items: AdminVendorDashboardItemDto[];
    pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  }> {
    const partnerId = this.PartnerContext.partnerId;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.VendorWhereInput = {
      partnerId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.vendorType ? { vendorType: query.vendorType } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          partnerId: true,
          name: true,
          slug: true,
          vendorType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              listings: true,
              interactions: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items: items.map((v) => ({
        id: v.id,
        partnerId: v.partnerId,
        name: v.name,
        slug: v.slug,
        vendorType: v.vendorType,
        status: v.status,
        listingsCount: v._count.listings,
        interactionsCount: v._count.interactions,
        reviewsCount: v._count.reviews,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      pagination: { page, pageSize, totalItems, totalPages },
    };
  }

  async listListingsDashboard(query: ListingQueryDto): Promise<{
    items: AdminListingDashboardItemDto[];
    pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  }> {
    const partnerId = this.PartnerContext.partnerId;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ListingWhereInput = {
      partnerId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.verticalType ? { verticalType: query.verticalType } : {}),
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.isFeatured !== undefined ? { isFeatured: query.isFeatured } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortBy =
      (query.sortBy as keyof Prisma.ListingOrderByWithRelationInput | undefined) ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const orderBy: Prisma.ListingOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          partnerId: true,
          vendorId: true,
          verticalType: true,
          status: true,
          title: true,
          slug: true,
          price: true,
          currency: true,
          isFeatured: true,
          publishedAt: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          vendor: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              interactions: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items: items.map((l) => ({
        id: l.id,
        partnerId: l.partnerId,
        vendorId: l.vendorId,
        vendor: l.vendor,
        verticalType: l.verticalType,
        status: l.status as ListingStatus,
        title: l.title,
        slug: l.slug,
        price: l.price,
        currency: l.currency,
        isFeatured: l.isFeatured,
        publishedAt: l.publishedAt,
        expiresAt: l.expiresAt,
        interactionsCount: l._count.interactions,
        reviewsCount: l._count.reviews,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
      pagination: { page, pageSize, totalItems, totalPages },
    };
  }

  async getSystemHealth(): Promise<AdminSystemHealthDto> {
    let databaseConnected = true;

    try {
      // Any trivial query is sufficient to validate DB connectivity.
      await this.prisma.partner.findFirst({ select: { id: true } });
    } catch (error) {
      databaseConnected = false;
      this.logger.warn(`Database health check failed: ${(error as Error).message}`);
    }

    const redisConnected = await this.redisService.isHealthy();

    const queuesRaw = await this.queueService.getAllQueuesStats();
    const queues: AdminSystemHealthQueueStatDto[] = queuesRaw.map((q) => ({
      name: q.name,
      waiting: q.waiting,
      active: q.active,
      completed: q.completed,
      failed: q.failed,
      delayed: q.delayed,
    }));

    const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0);
    const totalWaiting = queues.reduce((sum, q) => sum + q.waiting, 0);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!databaseConnected || !redisConnected) {
      status = 'unhealthy';
    } else if (totalFailed > 50) {
      status = 'unhealthy';
    } else if (totalFailed > 10 || totalWaiting > 1000) {
      status = 'degraded';
    }

    return {
      status,
      databaseConnected,
      redisConnected,
      queues,
      timestamp: new Date().toISOString(),
    };
  }

  async triggerBulkReindex(dto: BulkReindexRequestDto): Promise<BulkActionResponseDto> {
    const partnerId = this.PartnerContext.partnerId;

    const jobId = await this.queueService.addJob(
      QUEUE_NAMES.SEARCH_INDEX,
      JOB_TYPES.SEARCH.BULK_REINDEX,
      {
        partnerId,
        type: 'bulk.reindex',
        indexName: dto.entityType === 'vendor' ? 'vendors' : 'listings',
        entityType: dto.entityType,
        filters: dto.verticalType ? { verticalType: dto.verticalType } : undefined,
        batchSize: dto.batchSize ?? 100,
      },
    );

    return { jobId };
  }

  async triggerBulkExpireListings(
    dto: BulkExpireListingsRequestDto,
  ): Promise<BulkActionResponseDto> {
    const partnerId = this.PartnerContext.partnerId;

    const jobId = await this.queueService.addJob(
      QUEUE_NAMES.LISTING_EXPIRE,
      JOB_TYPES.LISTING_EXPIRE.EXPIRE_BATCH,
      {
        partnerId,
        type: 'listing.expire_batch',
        listingIds: dto.listingIds,
        reason: dto.reason,
      },
    );

    return { jobId };
  }

  private async assertTenantExists(id: string): Promise<void> {
    const exists = await this.prisma.partner.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Partner not found');
    }
  }

  private toTenantPlan(slug?: string | null, name?: string | null): string {
    const source = `${slug ?? ''} ${name ?? ''}`.toLowerCase();
    if (source.includes('enterprise')) return 'ENTERPRISE';
    if (source.includes('professional') || source.includes('pro')) return 'PROFESSIONAL';
    if (source.includes('starter')) return 'STARTER';
    return 'FREE';
  }

  private extractLogo(branding: Prisma.JsonValue | null): string | null {
    if (!branding || typeof branding !== 'object' || Array.isArray(branding)) {
      return null;
    }

    const logoUrl = (branding as Record<string, unknown>).logoUrl;
    return typeof logoUrl === 'string' ? logoUrl : null;
  }
}
