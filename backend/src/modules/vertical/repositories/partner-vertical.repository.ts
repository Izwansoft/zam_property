/**
 * Partner Vertical Repository
 * Part 8 - Vertical Module Contract
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class PartnerVerticalRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async ensurePartnerVerticalsFromTenantEnabledVerticals(partnerId: string): Promise<void> {
    const existingCount = await this.prisma.partnerVertical.count({ where: { partnerId } });
    if (existingCount > 0) {
      return;
    }

    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: { enabledVerticals: true },
    });

    const enabledTypes = partner?.enabledVerticals ?? [];
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

    await this.prisma.partnerVertical.createMany({
      data: definitions.map((d) => ({
        partnerId,
        verticalId: d.id,
        isEnabled: true,
      })),
      skipDuplicates: true,
    });
  }

  async syncTenantEnabledVerticals(partnerId: string): Promise<string[]> {
    const enabledTypes = await this.getEnabledVerticalTypes(partnerId);
    await this.prisma.partner.update({
      where: { id: partnerId },
      data: {
        enabledVerticals: enabledTypes,
      },
      select: { id: true },
    });
    return enabledTypes;
  }

  async create(data: Prisma.PartnerVerticalUncheckedCreateInput) {
    return this.prisma.partnerVertical.create({
      data,
      include: {
        vertical: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.partnerVertical.findUnique({
      where: { id },
      include: {
        vertical: true,
      },
    });
  }

  async findByTenantAndVertical(partnerId: string, verticalId: string) {
    return this.prisma.partnerVertical.findUnique({
      where: {
        partnerId_verticalId: { partnerId, verticalId },
      },
      include: {
        vertical: true,
      },
    });
  }

  async findByTenantAndVerticalType(partnerId: string, verticalType: string) {
    return this.prisma.partnerVertical.findFirst({
      where: {
        partnerId,
        vertical: { type: verticalType },
      },
      include: {
        vertical: true,
      },
    });
  }

  async findByTenant(partnerId: string, params?: { isEnabled?: boolean; verticalType?: string }) {
    await this.ensurePartnerVerticalsFromTenantEnabledVerticals(partnerId);

    const where: Prisma.PartnerVerticalWhereInput = {
      partnerId,
    };

    if (params?.isEnabled !== undefined) {
      where.isEnabled = params.isEnabled;
    }

    if (params?.verticalType) {
      where.vertical = { type: params.verticalType };
    }

    return this.prisma.partnerVertical.findMany({
      where,
      include: {
        vertical: true,
      },
      orderBy: {
        vertical: { name: 'asc' },
      },
    });
  }

  async findEnabledByTenant(partnerId: string) {
    await this.ensurePartnerVerticalsFromTenantEnabledVerticals(partnerId);

    return this.prisma.partnerVertical.findMany({
      where: {
        partnerId,
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

  async update(id: string, data: Prisma.PartnerVerticalUncheckedUpdateInput) {
    return this.prisma.partnerVertical.update({
      where: { id },
      data,
      include: {
        vertical: true,
      },
    });
  }

  async enable(id: string) {
    return this.prisma.partnerVertical.update({
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
    return this.prisma.partnerVertical.update({
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
    return this.prisma.partnerVertical.delete({
      where: { id },
    });
  }

  async isVerticalEnabledForTenant(partnerId: string, verticalType: string): Promise<boolean> {
    await this.ensurePartnerVerticalsFromTenantEnabledVerticals(partnerId);

    const count = await this.prisma.partnerVertical.count({
      where: {
        partnerId,
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

    // Legacy fallback: if PartnerVertical records haven't been created yet, honor Partner.enabledVerticals.
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: { enabledVerticals: true },
    });

    return (partner?.enabledVerticals ?? []).includes(verticalType);
  }

  async getEnabledVerticalTypes(partnerId: string): Promise<string[]> {
    await this.ensurePartnerVerticalsFromTenantEnabledVerticals(partnerId);

    const PartnerVerticals = await this.prisma.partnerVertical.findMany({
      where: {
        partnerId,
        isEnabled: true,
        vertical: { isActive: true },
      },
      include: {
        vertical: {
          select: { type: true },
        },
      },
    });

    const enabledTypes = PartnerVerticals.map((tv) => tv.vertical.type);
    if (enabledTypes.length > 0) {
      return enabledTypes;
    }

    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: { enabledVerticals: true },
    });

    return partner?.enabledVerticals ?? [];
  }

  async getListingLimit(partnerId: string, verticalType: string): Promise<number | null> {
    const PartnerVertical = await this.prisma.partnerVertical.findFirst({
      where: {
        partnerId,
        vertical: { type: verticalType },
        isEnabled: true,
      },
      select: { listingLimit: true },
    });

    return PartnerVertical?.listingLimit ?? null;
  }

  async countEnabledVerticals(partnerId: string): Promise<number> {
    return this.prisma.partnerVertical.count({
      where: {
        partnerId,
        isEnabled: true,
        vertical: { isActive: true },
      },
    });
  }
}
