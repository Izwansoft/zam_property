/**
 * Vertical Definition Repository
 * Part 8 - Vertical Module Contract
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class VerticalDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.VerticalDefinitionCreateInput) {
    return this.prisma.verticalDefinition.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.verticalDefinition.findUnique({
      where: { id },
    });
  }

  async findByType(type: string) {
    return this.prisma.verticalDefinition.findUnique({
      where: { type },
    });
  }

  async findMany(params?: { isActive?: boolean; isCore?: boolean }) {
    const where: Prisma.VerticalDefinitionWhereInput = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.isCore !== undefined) {
      where.isCore = params.isCore;
    }

    return this.prisma.verticalDefinition.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.verticalDefinition.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: Prisma.VerticalDefinitionUpdateInput) {
    return this.prisma.verticalDefinition.update({
      where: { id },
      data,
    });
  }

  async activate(id: string) {
    return this.prisma.verticalDefinition.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string) {
    return this.prisma.verticalDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: string) {
    return this.prisma.verticalDefinition.delete({
      where: { id },
    });
  }

  async countTenantUsage(verticalId: string) {
    return this.prisma.partnerVertical.count({
      where: {
        verticalId,
        isEnabled: true,
      },
    });
  }

  async exists(type: string): Promise<boolean> {
    const count = await this.prisma.verticalDefinition.count({
      where: { type },
    });
    return count > 0;
  }
}
