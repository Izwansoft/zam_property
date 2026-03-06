import { Injectable, Scope } from '@nestjs/common';
import type { Prisma, TenantStatus } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { BasePartnerRepository, PartnerContextService } from '@core/partner-context';

export interface TenantView {
  id: string;
  userId: string;
  partnerId: string;
  status: TenantStatus;
  employmentType: string | null;
  monthlyIncome: number | null;
  employer: string | null;
  icNumber: string | null;
  passportNumber: string | null;
  icVerified: boolean;
  incomeVerified: boolean;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  screeningScore: number | null;
  screeningNotes: string | null;
  screenedAt: Date | null;
  screenedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
  };
}

export interface TenantDetailView extends TenantView {
  documents: TenantDocumentView[];
  tenancies: {
    id: string;
    status: string;
    leaseStartDate: Date | null;
    leaseEndDate: Date | null;
    monthlyRent: number | null;
  }[];
}

export interface TenantDocumentView {
  id: string;
  tenantId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verified: boolean;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
}

const tenantSelect = {
  id: true,
  userId: true,
  partnerId: true,
  status: true,
  employmentType: true,
  monthlyIncome: true,
  employer: true,
  icNumber: true,
  passportNumber: true,
  icVerified: true,
  incomeVerified: true,
  emergencyName: true,
  emergencyPhone: true,
  emergencyRelation: true,
  screeningScore: true,
  screeningNotes: true,
  screenedAt: true,
  screenedBy: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
    },
  },
} as const;

const tenantDetailSelect = {
  ...tenantSelect,
  documents: {
    select: {
      id: true,
      tenantId: true,
      type: true,
      fileName: true,
      fileUrl: true,
      fileSize: true,
      mimeType: true,
      verified: true,
      verifiedAt: true,
      verifiedBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  tenancies: {
    select: {
      id: true,
      status: true,
      leaseStartDate: true,
      leaseEndDate: true,
      monthlyRent: true,
    },
    orderBy: { createdAt: 'desc' as const },
    take: 10,
  },
} as const;

const documentSelect = {
  id: true,
  tenantId: true,
  type: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
  verified: true,
  verifiedAt: true,
  verifiedBy: true,
  createdAt: true,
} as const;

@Injectable({ scope: Scope.REQUEST })
export class TenantRepository extends BasePartnerRepository {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly PartnerContext: PartnerContextService,
  ) {
    super(prisma, PartnerContext);
  }

  async list(params: {
    skip?: number;
    take?: number;
    status?: TenantStatus;
    search?: string;
    icVerified?: boolean;
    incomeVerified?: boolean;
  }): Promise<TenantView[]> {
    const where = this.buildWhereClause(params);

    const tenants = await this.prisma.tenant.findMany({
      where,
      select: tenantSelect,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map(this.mapToView);
  }

  async count(params: {
    status?: TenantStatus;
    search?: string;
    icVerified?: boolean;
    incomeVerified?: boolean;
  }): Promise<number> {
    const where = this.buildWhereClause(params);
    return this.prisma.tenant.count({ where });
  }

  async findById(id: string): Promise<TenantView | null> {
    const partnerId = this.partnerId;
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, partnerId },
      select: tenantSelect,
    });
    return tenant ? this.mapToView(tenant) : null;
  }

  async findByIdWithDetails(id: string): Promise<TenantDetailView | null> {
    const partnerId = this.partnerId;
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, partnerId },
      select: tenantDetailSelect,
    });
    return tenant ? this.mapToDetailView(tenant) : null;
  }

  async findByUserId(userId: string): Promise<TenantView | null> {
    const partnerId = this.partnerId;
    const tenant = await this.prisma.tenant.findFirst({
      where: { userId, partnerId },
      select: tenantSelect,
    });
    return tenant ? this.mapToView(tenant) : null;
  }

  async create(data: {
    userId: string;
    employmentType?: string;
    monthlyIncome?: number;
    employer?: string;
    icNumber?: string;
    passportNumber?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
  }): Promise<TenantView> {
    const partnerId = this.partnerId;
    const tenant = await this.prisma.tenant.create({
      data: {
        userId: data.userId,
        partnerId,
        employmentType: data.employmentType,
        monthlyIncome: data.monthlyIncome,
        employer: data.employer,
        icNumber: data.icNumber,
        passportNumber: data.passportNumber,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        emergencyRelation: data.emergencyRelation,
      },
      select: tenantSelect,
    });
    return this.mapToView(tenant);
  }

  async update(
    id: string,
    data: Partial<{
      employmentType: string;
      monthlyIncome: number;
      employer: string;
      icNumber: string;
      passportNumber: string;
      emergencyName: string;
      emergencyPhone: string;
      emergencyRelation: string;
      status: TenantStatus;
      icVerified: boolean;
      incomeVerified: boolean;
      screeningScore: number;
      screeningNotes: string;
      screenedAt: Date;
      screenedBy: string;
    }>,
  ): Promise<TenantView> {
    const partnerId = this.partnerId;
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...data,
        partnerId, // Ensure partner context
      },
      select: tenantSelect,
    });
    return this.mapToView(tenant);
  }

  async updateStatus(id: string, status: TenantStatus): Promise<TenantView> {
    return this.update(id, { status });
  }

  // Document methods
  async createDocument(data: {
    tenantId: string;
    type: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }): Promise<TenantDocumentView> {
    const document = await this.prisma.tenantDocument.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      },
      select: documentSelect,
    });
    return document;
  }

  async findDocumentById(id: string): Promise<TenantDocumentView | null> {
    const partnerId = this.partnerId;
    const document = await this.prisma.tenantDocument.findFirst({
      where: {
        id,
        tenant: { partnerId },
      },
      select: documentSelect,
    });
    return document;
  }

  async findDocumentsByTenantId(tenantId: string): Promise<TenantDocumentView[]> {
    const documents = await this.prisma.tenantDocument.findMany({
      where: { tenantId },
      select: documentSelect,
      orderBy: { createdAt: 'desc' },
    });
    return documents;
  }

  async updateDocument(
    id: string,
    data: {
      verified?: boolean;
      verifiedAt?: Date;
      verifiedBy?: string;
    },
  ): Promise<TenantDocumentView> {
    const document = await this.prisma.tenantDocument.update({
      where: { id },
      data,
      select: documentSelect,
    });
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.prisma.tenantDocument.delete({
      where: { id },
    });
  }

  // Find tenants by property (via tenancy)
  async findByListingId(listingId: string): Promise<TenantView[]> {
    const partnerId = this.partnerId;
    const tenants = await this.prisma.tenant.findMany({
      where: {
        partnerId,
        tenancies: {
          some: { listingId },
        },
      },
      select: tenantSelect,
    });
    return tenants.map(this.mapToView);
  }

  // Find tenants by vendor (property owner)
  async findByVendorId(vendorId: string): Promise<TenantView[]> {
    const partnerId = this.partnerId;
    const tenants = await this.prisma.tenant.findMany({
      where: {
        partnerId,
        tenancies: {
          some: { ownerId: vendorId },
        },
      },
      select: tenantSelect,
    });
    return tenants.map(this.mapToView);
  }

  private buildWhereClause(params: {
    status?: TenantStatus;
    search?: string;
    icVerified?: boolean;
    incomeVerified?: boolean;
  }): Prisma.TenantWhereInput {
    const partnerId = this.partnerId;
    const where: Prisma.TenantWhereInput = { partnerId };

    if (params.status) {
      where.status = params.status;
    }

    if (params.icVerified !== undefined) {
      where.icVerified = params.icVerified;
    }

    if (params.incomeVerified !== undefined) {
      where.incomeVerified = params.incomeVerified;
    }

    if (params.search) {
      where.OR = [
        { user: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { icNumber: { contains: params.search, mode: 'insensitive' } },
        { passportNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private mapToView(tenant: any): TenantView {
    return {
      id: tenant.id,
      userId: tenant.userId,
      partnerId: tenant.partnerId,
      status: tenant.status,
      employmentType: tenant.employmentType,
      monthlyIncome: tenant.monthlyIncome ? Number(tenant.monthlyIncome) : null,
      employer: tenant.employer,
      icNumber: tenant.icNumber,
      passportNumber: tenant.passportNumber,
      icVerified: tenant.icVerified,
      incomeVerified: tenant.incomeVerified,
      emergencyName: tenant.emergencyName,
      emergencyPhone: tenant.emergencyPhone,
      emergencyRelation: tenant.emergencyRelation,
      screeningScore: tenant.screeningScore,
      screeningNotes: tenant.screeningNotes,
      screenedAt: tenant.screenedAt,
      screenedBy: tenant.screenedBy,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      user: tenant.user,
    };
  }

  private mapToDetailView(tenant: any): TenantDetailView {
    return {
      ...this.mapToView(tenant),
      documents: tenant.documents,
      tenancies: tenant.tenancies.map((t: any) => ({
        id: t.id,
        status: t.status,
        leaseStartDate: t.leaseStartDate,
        leaseEndDate: t.leaseEndDate,
        monthlyRent: t.monthlyRent ? Number(t.monthlyRent) : null,
      })),
    };
  }
}
