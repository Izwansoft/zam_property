import { Injectable, Scope } from '@nestjs/common';
import type { Prisma, VendorStatus, VendorType, UserVendorRole } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { BasePartnerRepository, PartnerContextService } from '@core/partner-context';

export interface VendorView {
  id: string;
  partnerId: string;
  name: string;
  slug: string;
  description: string | null;
  vendorType: VendorType;
  verticalType: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: VendorStatus;
  verifiedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorDetailView extends VendorView {
  profile: {
    businessRegNo: string | null;
    taxId: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    socialLinks: Prisma.JsonValue | null;
    operatingHours: Prisma.JsonValue | null;
  } | null;
  settings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    leadNotifications: boolean;
    autoResponseEnabled: boolean;
    autoResponseMessage: string | null;
    showPhone: boolean;
    showEmail: boolean;
  } | null;
}

const vendorSelect = {
  id: true,
  partnerId: true,
  name: true,
  slug: true,
  description: true,
  vendorType: true,
  verticalType: true,
  email: true,
  phone: true,
  website: true,
  status: true,
  verifiedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
} as const;

const vendorDetailSelect = {
  ...vendorSelect,
  profile: {
    select: {
      businessRegNo: true,
      taxId: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      logoUrl: true,
      bannerUrl: true,
      socialLinks: true,
      operatingHours: true,
    },
  },
  settings: {
    select: {
      emailNotifications: true,
      smsNotifications: true,
      leadNotifications: true,
      autoResponseEnabled: true,
      autoResponseMessage: true,
      showPhone: true,
      showEmail: true,
    },
  },
} as const;

@Injectable({ scope: Scope.REQUEST })
export class VendorRepository extends BasePartnerRepository {
  constructor(prisma: PrismaService, PartnerContext: PartnerContextService) {
    super(prisma, PartnerContext);
  }

  async findById(id: string): Promise<VendorView | null> {
    return this.prisma.vendor.findFirst({
      where: this.scopeWhere({ id, deletedAt: null }),
      select: vendorSelect,
    });
  }

  async findByIdWithDetails(id: string): Promise<VendorDetailView | null> {
    return this.prisma.vendor.findFirst({
      where: this.scopeWhere({ id, deletedAt: null }),
      select: vendorDetailSelect,
    });
  }

  async findBySlug(slug: string): Promise<VendorView | null> {
    return this.prisma.vendor.findFirst({
      where: this.scopeWhere({ slug, deletedAt: null }),
      select: vendorSelect,
    });
  }

  async list(params: {
    skip: number;
    take: number;
    status?: VendorStatus;
    vendorType?: VendorType;
    search?: string;
    verticalType?: string;
  }): Promise<VendorView[]> {
    const where: Prisma.VendorWhereInput = this.scopeWhere({ deletedAt: null });

    if (params.status) {
      where.status = params.status;
    }

    if (params.vendorType) {
      where.vendorType = params.vendorType;
    }

    if (params.verticalType) {
      where.verticalType = params.verticalType;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
      select: vendorSelect,
    });
  }

  async count(params?: {
    status?: VendorStatus;
    vendorType?: VendorType;
    search?: string;
    verticalType?: string;
  }): Promise<number> {
    const where: Prisma.VendorWhereInput = this.scopeWhere({ deletedAt: null });

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.vendorType) {
      where.vendorType = params.vendorType;
    }

    if (params?.verticalType) {
      where.verticalType = params.verticalType;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.vendor.count({ where });
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    vendorType?: VendorType;
    verticalType?: string;
    email?: string;
    phone?: string;
    website?: string;
  }): Promise<VendorView> {
    return this.prisma.vendor.create({
      data: this.scopeCreateData({
        name: data.name,
        slug: data.slug,
        description: data.description,
        vendorType: data.vendorType,
        verticalType: data.verticalType,
        email: data.email,
        phone: data.phone,
        website: data.website,
      }),
      select: vendorSelect,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      vendorType?: VendorType;
      email?: string;
      phone?: string;
      website?: string;
    },
  ): Promise<VendorView | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.prisma.vendor.update({
      where: { id },
      data,
      select: vendorSelect,
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: VendorStatus;
      approvedBy?: string;
      approvedAt?: Date;
      rejectedBy?: string;
      rejectedAt?: Date;
      rejectionReason?: string;
    },
  ): Promise<VendorView | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.prisma.vendor.update({
      where: { id },
      data,
      select: vendorSelect,
    });
  }

  async softDelete(id: string): Promise<VendorView | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: vendorSelect,
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.VendorWhereInput = this.scopeWhere({ slug, deletedAt: null });
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.vendor.count({ where });
    return count > 0;
  }

  // Profile operations
  async upsertProfile(
    vendorId: string,
    data: {
      businessRegNo?: string;
      taxId?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      logoUrl?: string;
      bannerUrl?: string;
      socialLinks?: Prisma.InputJsonValue;
      operatingHours?: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await this.prisma.vendorProfile.upsert({
      where: { vendorId },
      create: { vendorId, ...data },
      update: data,
    });
  }

  // Settings operations
  async upsertSettings(
    vendorId: string,
    data: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      leadNotifications?: boolean;
      autoResponseEnabled?: boolean;
      autoResponseMessage?: string;
      showPhone?: boolean;
      showEmail?: boolean;
    },
  ): Promise<void> {
    await this.prisma.vendorSettings.upsert({
      where: { vendorId },
      create: { vendorId, ...data },
      update: data,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER-VENDOR JUNCTION OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  async addUserToVendor(
    userId: string,
    vendorId: string,
    role: UserVendorRole,
    isPrimary: boolean = false,
  ) {
    return this.prisma.userVendor.create({
      data: { userId, vendorId, role, isPrimary },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        vendor: { select: { id: true, name: true, verticalType: true } },
      },
    });
  }

  async removeUserFromVendor(userId: string, vendorId: string) {
    return this.prisma.userVendor.delete({
      where: { userId_vendorId: { userId, vendorId } },
    });
  }

  async getUserVendors(userId: string) {
    return this.prisma.userVendor.findMany({
      where: { userId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            verticalType: true,
            vendorType: true,
            status: true,
            updatedAt: true,
            rejectionReason: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getVendorUsers(vendorId: string) {
    return this.prisma.userVendor.findMany({
      where: { vendorId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateUserVendorRole(userId: string, vendorId: string, role: UserVendorRole) {
    return this.prisma.userVendor.update({
      where: { userId_vendorId: { userId, vendorId } },
      data: { role },
    });
  }

  async setUserPrimaryVendor(userId: string, vendorId: string) {
    // First, unset all primary flags for this user
    await this.prisma.userVendor.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set the specified vendor as primary
    return this.prisma.userVendor.update({
      where: { userId_vendorId: { userId, vendorId } },
      data: { isPrimary: true },
    });
  }
}
