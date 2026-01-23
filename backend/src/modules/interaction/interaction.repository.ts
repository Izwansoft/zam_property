import { Injectable } from '@nestjs/common';
import { InteractionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { TenantContextService } from '@core/tenant-context/tenant-context.service';
import {
  InteractionRecord,
  CreateInteractionParams,
  FindManyInteractionsParams,
  UpdateInteractionStatusParams,
} from './types/interaction.types';

@Injectable()
export class InteractionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create a new interaction
   */
  async create(params: CreateInteractionParams): Promise<InteractionRecord> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.interaction.create({
      data: {
        tenantId,
        vendorId: params.vendorId,
        listingId: params.listingId,
        verticalType: params.verticalType,
        interactionType: params.interactionType,
        contactName: params.contactName,
        contactEmail: params.contactEmail,
        contactPhone: params.contactPhone,
        message: params.message,
        bookingData: params.bookingData as Prisma.InputJsonValue,
        source: params.source || 'web',
        referrer: params.referrer,
        status: InteractionStatus.NEW,
      },
    });
  }

  /**
   * Find interaction by ID (tenant-scoped)
   */
  async findById(id: string): Promise<InteractionRecord | null> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.interaction.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Find many interactions with pagination and filtering
   */
  async findMany(params: FindManyInteractionsParams): Promise<{
    data: InteractionRecord[];
    total: number;
  }> {
    const tenantId = this.tenantContext.tenantId;
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      tenantId,
    };

    if (params.vendorId) {
      where.vendorId = params.vendorId;
    }

    if (params.listingId) {
      where.listingId = params.listingId;
    }

    if (params.interactionType) {
      where.interactionType = params.interactionType;
    }

    if (params.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.interaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.interaction.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find interactions by vendor
   */
  async findByVendor(vendorId: string): Promise<InteractionRecord[]> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.interaction.findMany({
      where: {
        tenantId,
        vendorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find interactions by listing
   */
  async findByListing(listingId: string): Promise<InteractionRecord[]> {
    const tenantId = this.tenantContext.tenantId;

    return this.prisma.interaction.findMany({
      where: {
        tenantId,
        listingId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update interaction status
   */
  async updateStatus(
    id: string,
    params: UpdateInteractionStatusParams,
  ): Promise<InteractionRecord> {
    const tenantId = this.tenantContext.tenantId;

    const updateData: Record<string, unknown> = {
      status: params.status,
      updatedAt: new Date(),
    };

    // Set timestamp fields based on status
    if (params.status === InteractionStatus.CONTACTED) {
      updateData.contactedAt = new Date();
    } else if (
      params.status === InteractionStatus.CLOSED ||
      params.status === InteractionStatus.INVALID
    ) {
      updateData.closedAt = new Date();
    }

    return this.prisma.interaction.update({
      where: {
        id,
        tenantId,
      },
      data: updateData,
    });
  }

  /**
   * Count interactions by status
   */
  async countByStatus(vendorId?: string): Promise<Record<string, number>> {
    const tenantId = this.tenantContext.tenantId;

    const where: Record<string, unknown> = {
      tenantId,
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const counts = await this.prisma.interaction.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    return counts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
