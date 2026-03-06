import { Injectable, Scope } from '@nestjs/common';
import type { Prisma, TenancyStatus } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { BasePartnerRepository, PartnerContextService } from '@core/partner-context';

// View interfaces for type-safe responses

export interface TenancyView {
  id: string;
  partnerId: string;
  listingId: string;
  ownerId: string;
  tenantId: string;
  status: TenancyStatus;
  applicationDate: Date;
  moveInDate: Date | null;
  moveOutDate: Date | null;
  leaseStartDate: Date | null;
  leaseEndDate: Date | null;
  actualEndDate: Date | null;
  monthlyRent: number;
  securityDeposit: number;
  utilityDeposit: number | null;
  keyDeposit: number | null;
  billingDay: number;
  paymentDueDay: number;
  lateFeePercent: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  listing: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
  owner: {
    id: string;
    name: string;
    email: string | null;
  };
  tenant: {
    id: string;
    userId: string;
    status: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      phone: string | null;
    };
  };
}

export interface TenancyDetailView extends TenancyView {
  contract: {
    id: string;
    contractNumber: string;
    status: string;
    startDate: Date;
    endDate: Date;
    signedDate: Date | null;
  } | null;
  deposits: {
    id: string;
    type: string;
    amount: number;
    status: string;
    collectedAt: Date | null;
  }[];
  statusHistory: TenancyStatusHistoryView[];
}

export interface TenancyStatusHistoryView {
  id: string;
  tenancyId: string;
  fromStatus: TenancyStatus | null;
  toStatus: TenancyStatus;
  reason: string | null;
  changedBy: string;
  changedAt: Date;
}

// Select objects for Prisma queries

const tenancySelect = {
  id: true,
  partnerId: true,
  listingId: true,
  ownerId: true,
  tenantId: true,
  status: true,
  applicationDate: true,
  moveInDate: true,
  moveOutDate: true,
  leaseStartDate: true,
  leaseEndDate: true,
  actualEndDate: true,
  monthlyRent: true,
  securityDeposit: true,
  utilityDeposit: true,
  keyDeposit: true,
  billingDay: true,
  paymentDueDay: true,
  lateFeePercent: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  listing: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
  },
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  tenant: {
    select: {
      id: true,
      userId: true,
      status: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
        },
      },
    },
  },
} as const;

const tenancyDetailSelect = {
  ...tenancySelect,
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
  deposits: {
    select: {
      id: true,
      type: true,
      amount: true,
      status: true,
      collectedAt: true,
    },
  },
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
    orderBy: { changedAt: 'desc' as const },
  },
} as const;

const statusHistorySelect = {
  id: true,
  tenancyId: true,
  fromStatus: true,
  toStatus: true,
  reason: true,
  changedBy: true,
  changedAt: true,
} as const;

@Injectable({ scope: Scope.REQUEST })
export class TenancyRepository extends BasePartnerRepository {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly PartnerContext: PartnerContextService,
  ) {
    super(prisma, PartnerContext);
  }

  /**
   * Create a new tenancy
   */
  async create(data: Prisma.TenancyUncheckedCreateInput): Promise<TenancyView> {
    const tenancy = await this.prisma.tenancy.create({
      data: {
        ...data,
        partnerId: this.partnerId,
      },
      select: tenancySelect,
    });

    return this.transformTenancyView(tenancy);
  }

  /**
   * Find tenancy by ID
   */
  async findById(id: string): Promise<TenancyDetailView | null> {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id,
        partnerId: this.partnerId,
      },
      select: tenancyDetailSelect,
    });

    return tenancy ? this.transformTenancyDetailView(tenancy) : null;
  }

  /**
   * Find tenancy by ID (simple view)
   */
  async findByIdSimple(id: string): Promise<TenancyView | null> {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id,
        partnerId: this.partnerId,
      },
      select: tenancySelect,
    });

    return tenancy ? this.transformTenancyView(tenancy) : null;
  }

  /**
   * Find tenancies with filtering and pagination
   */
  async findMany(options: {
    where?: Prisma.TenancyWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.TenancyOrderByWithRelationInput;
  }): Promise<{ items: TenancyView[]; total: number }> {
    const { where = {}, skip = 0, take = 20, orderBy = { createdAt: 'desc' } } = options;

    const baseWhere: Prisma.TenancyWhereInput = {
      ...where,
      partnerId: this.partnerId,
    };

    const [items, total] = await Promise.all([
      this.prisma.tenancy.findMany({
        where: baseWhere,
        select: tenancySelect,
        skip,
        take,
        orderBy,
      }),
      this.prisma.tenancy.count({ where: baseWhere }),
    ]);

    return {
      items: items.map((t) => this.transformTenancyView(t)),
      total,
    };
  }

  /**
   * Find tenancies by tenant ID
   */
  async findByTenantId(tenantId: string): Promise<TenancyView[]> {
    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        tenantId,
        partnerId: this.partnerId,
      },
      select: tenancySelect,
      orderBy: { createdAt: 'desc' },
    });

    return tenancies.map((t) => this.transformTenancyView(t));
  }

  /**
   * Find tenancies by owner (vendor) ID
   */
  async findByOwnerId(ownerId: string): Promise<TenancyView[]> {
    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        ownerId,
        partnerId: this.partnerId,
      },
      select: tenancySelect,
      orderBy: { createdAt: 'desc' },
    });

    return tenancies.map((t) => this.transformTenancyView(t));
  }

  /**
   * Find tenancies by listing ID
   */
  async findByListingId(listingId: string): Promise<TenancyView[]> {
    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        listingId,
        partnerId: this.partnerId,
      },
      select: tenancySelect,
      orderBy: { createdAt: 'desc' },
    });

    return tenancies.map((t) => this.transformTenancyView(t));
  }

  /**
   * Find active tenancy for a listing (should only be one)
   */
  async findActiveByListingId(listingId: string): Promise<TenancyView | null> {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        listingId,
        partnerId: this.partnerId,
        status: 'ACTIVE',
      },
      select: tenancySelect,
    });

    return tenancy ? this.transformTenancyView(tenancy) : null;
  }

  /**
   * Update tenancy
   */
  async update(id: string, data: Prisma.TenancyUncheckedUpdateInput): Promise<TenancyView> {
    const tenancy = await this.prisma.tenancy.update({
      where: { id },
      data,
      select: tenancySelect,
    });

    return this.transformTenancyView(tenancy);
  }

  /**
   * Update tenancy status with history tracking
   */
  async updateStatus(
    id: string,
    fromStatus: TenancyStatus | null,
    toStatus: TenancyStatus,
    changedBy: string,
    reason?: string,
    additionalData?: Prisma.TenancyUncheckedUpdateInput,
  ): Promise<TenancyDetailView> {
    const tenancy = await this.prisma.tenancy.update({
      where: { id },
      data: {
        ...additionalData,
        status: toStatus,
        statusHistory: {
          create: {
            fromStatus,
            toStatus,
            reason,
            changedBy,
          },
        },
      },
      select: tenancyDetailSelect,
    });

    return this.transformTenancyDetailView(tenancy);
  }

  /**
   * Get status history for a tenancy
   */
  async getStatusHistory(tenancyId: string): Promise<TenancyStatusHistoryView[]> {
    const history = await this.prisma.tenancyStatusHistory.findMany({
      where: {
        tenancyId,
        tenancy: {
          partnerId: this.partnerId,
        },
      },
      select: statusHistorySelect,
      orderBy: { changedAt: 'desc' },
    });

    return history;
  }

  /**
   * Check if listing has any non-terminated tenancies
   */
  async hasActiveTenancy(listingId: string): Promise<boolean> {
    const count = await this.prisma.tenancy.count({
      where: {
        listingId,
        partnerId: this.partnerId,
        status: {
          notIn: ['TERMINATED'],
        },
      },
    });

    return count > 0;
  }

  /**
   * Find tenancies expiring soon (for renewal notifications)
   */
  async findExpiringSoon(daysAhead: number): Promise<TenancyView[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        partnerId: this.partnerId,
        status: 'ACTIVE',
        leaseEndDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      select: tenancySelect,
      orderBy: { leaseEndDate: 'asc' },
    });

    return tenancies.map((t) => this.transformTenancyView(t));
  }

  // Transform helpers

  private transformTenancyView(tenancy: any): TenancyView {
    return {
      ...tenancy,
      monthlyRent: tenancy.monthlyRent ? Number(tenancy.monthlyRent) : 0,
      securityDeposit: tenancy.securityDeposit ? Number(tenancy.securityDeposit) : 0,
      utilityDeposit: tenancy.utilityDeposit ? Number(tenancy.utilityDeposit) : null,
      keyDeposit: tenancy.keyDeposit ? Number(tenancy.keyDeposit) : null,
      lateFeePercent: tenancy.lateFeePercent ? Number(tenancy.lateFeePercent) : null,
    };
  }

  private transformTenancyDetailView(tenancy: any): TenancyDetailView {
    return {
      ...this.transformTenancyView(tenancy),
      contract: tenancy.contract,
      deposits: tenancy.deposits?.map((d: any) => ({
        ...d,
        amount: d.amount ? Number(d.amount) : 0,
      })) || [],
      statusHistory: tenancy.statusHistory || [],
    };
  }
}
