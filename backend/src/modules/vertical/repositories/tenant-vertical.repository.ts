/**
 * Tenant Vertical Repository
 * Part 8 - Vertical Module Contract
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class TenantVerticalRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTenantVerticalsFromTenantEnabledVerticals(tenantId: string): Promise<void> {
    const existingCount = await this.prisma.tenantVertical.count({ where: { tenantId } });
    if (existingCount > 0) {
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledVerticals: true },
    });

    const enabledTypes = tenant?.enabledVerticals ?? [];
    if (enabledTypes.length === 0) {
      return;
    }

    const definitions = await this.prisma.verticalDefinition.findMany({
      where: { type: { in: enabledTypes } },
      select: { id: true, type: true },
    });

    if (definitions.length === 0) {
      return;
    }

    await this.prisma.tenantVertical.createMany({
      data: definitions.map((d) => ({
        tenantId,
        verticalId: d.id,
        isEnabled: true,
      })),
      skipDuplicates: true,
    });
  }

  async syncTenantEnabledVerticals(tenantId: string): Promise<string[]> {
    const enabledTypes = await this.getEnabledVerticalTypes(tenantId);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        enabledVerticals: enabledTypes,
      },
      select: { id: true },
    });
    return enabledTypes;
  }

  async create(data: Prisma.TenantVerticalUncheckedCreateInput) {
    return this.prisma.tenantVertical.create({
      data,
      include: {
        vertical: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.tenantVertical.findUnique({
      where: { id },
      include: {
        vertical: true,
      },
    });
  }

  async findByTenantAndVertical(tenantId: string, verticalId: string) {
    return this.prisma.tenantVertical.findUnique({
      where: {
        tenantId_verticalId: { tenantId, verticalId },
      },
      include: {
        vertical: true,
      },
    });
  }

  async findByTenantAndVerticalType(tenantId: string, verticalType: string) {
    return this.prisma.tenantVertical.findFirst({
      where: {
        tenantId,
        vertical: { type: verticalType },
      },
      include: {
        vertical: true,
      },
    });
  }

  async findByTenant(tenantId: string, params?: { isEnabled?: boolean; verticalType?: string }) {
    await this.ensureTenantVerticalsFromTenantEnabledVerticals(tenantId);

    const where: Prisma.TenantVerticalWhereInput = {
      tenantId,
    };

    if (params?.isEnabled !== undefined) {
      where.isEnabled = params.isEnabled;
    }

    if (params?.verticalType) {
      where.vertical = { type: params.verticalType };
    }

    return this.prisma.tenantVertical.findMany({
      where,
      include: {
        vertical: true,
      },
      orderBy: {
        vertical: { name: 'asc' },
      },
    });
  }

  async findEnabledByTenant(tenantId: string) {
    await this.ensureTenantVerticalsFromTenantEnabledVerticals(tenantId);

    return this.prisma.tenantVertical.findMany({
      where: {
        tenantId,
        isEnabled: true,
        vertical: { isActive: true },
      },
      include: {
        vertical: true,
      },
      orderBy: {
        vertical: { name: 'asc' },
      },
    });
  }

  async update(id: string, data: Prisma.TenantVerticalUncheckedUpdateInput) {
    return this.prisma.tenantVertical.update({
      where: { id },
      data,
      include: {
        vertical: true,
      },
    });
  }

  async enable(id: string) {
    return this.prisma.tenantVertical.update({
      where: { id },
      data: {
        isEnabled: true,
        disabledAt: null,
      },
      include: {
        vertical: true,
      },
    });
  }

  async disable(id: string) {
    return this.prisma.tenantVertical.update({
      where: { id },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
      },
      include: {
        vertical: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.tenantVertical.delete({
      where: { id },
    });
  }

  async isVerticalEnabledForTenant(tenantId: string, verticalType: string): Promise<boolean> {
    await this.ensureTenantVerticalsFromTenantEnabledVerticals(tenantId);

    const count = await this.prisma.tenantVertical.count({
      where: {
        tenantId,
        isEnabled: true,
        vertical: {
          type: verticalType,
          isActive: true,
        },
      },
    });

    if (count > 0) {
      return true;
    }

    // Legacy fallback: if TenantVertical records haven't been created yet, honor Tenant.enabledVerticals.
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledVerticals: true },
    });

    return (tenant?.enabledVerticals ?? []).includes(verticalType);
  }

  async getEnabledVerticalTypes(tenantId: string): Promise<string[]> {
    await this.ensureTenantVerticalsFromTenantEnabledVerticals(tenantId);

    const tenantVerticals = await this.prisma.tenantVertical.findMany({
      where: {
        tenantId,
        isEnabled: true,
        vertical: { isActive: true },
      },
      include: {
        vertical: {
          select: { type: true },
        },
      },
    });

    const enabledTypes = tenantVerticals.map((tv) => tv.vertical.type);
    if (enabledTypes.length > 0) {
      return enabledTypes;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledVerticals: true },
    });

    return tenant?.enabledVerticals ?? [];
  }

  async getListingLimit(tenantId: string, verticalType: string): Promise<number | null> {
    const tenantVertical = await this.prisma.tenantVertical.findFirst({
      where: {
        tenantId,
        vertical: { type: verticalType },
        isEnabled: true,
      },
      select: { listingLimit: true },
    });

    return tenantVertical?.listingLimit ?? null;
  }

  async countEnabledVerticals(tenantId: string): Promise<number> {
    return this.prisma.tenantVertical.count({
      where: {
        tenantId,
        isEnabled: true,
        vertical: { isActive: true },
      },
    });
  }
}
