import { Injectable, Logger, Scope } from '@nestjs/common';
import { ListingStatus, ReviewStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { TenantContextService } from '@core/tenant-context';
import { PrismaService } from '@infrastructure/database';
import { QueueService } from '@infrastructure/queue';
import { JOB_TYPES, QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { RedisService } from '@infrastructure/redis';

import type { ListingQueryDto } from '@modules/listing/dto';
import type { VendorQueryDto } from '@modules/vendor/dto';

import type {
  AdminListingDashboardItemDto,
  AdminSystemHealthDto,
  AdminSystemHealthQueueStatDto,
  AdminVendorDashboardItemDto,
  BulkActionResponseDto,
  BulkExpireListingsRequestDto,
  BulkReindexRequestDto,
  StatusCountDto,
  TenantDashboardStatsDto,
} from './dto';

@Injectable({ scope: Scope.REQUEST })
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
  ) {}

  async getTenantDashboardStats(): Promise<TenantDashboardStatsDto> {
    const tenantId = this.tenantContext.tenantId;
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
        where: { tenantId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { tenantId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.interaction.groupBy({
        by: ['interactionType'],
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
        _count: { _all: true },
      }),
      this.prisma.vendor.count({
        where: { tenantId, deletedAt: null, status: 'PENDING' },
      }),
      this.prisma.review.count({
        where: { tenantId, status: ReviewStatus.PENDING },
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

  async listVendorsDashboard(query: VendorQueryDto): Promise<{
    items: AdminVendorDashboardItemDto[];
    pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  }> {
    const tenantId = this.tenantContext.tenantId;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.VendorWhereInput = {
      tenantId,
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
          tenantId: true,
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
        tenantId: v.tenantId,
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
    const tenantId = this.tenantContext.tenantId;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ListingWhereInput = {
      tenantId,
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
          tenantId: true,
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
        tenantId: l.tenantId,
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
      await this.prisma.tenant.findFirst({ select: { id: true } });
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
    const tenantId = this.tenantContext.tenantId;

    const jobId = await this.queueService.addJob(
      QUEUE_NAMES.SEARCH_INDEX,
      JOB_TYPES.SEARCH.BULK_REINDEX,
      {
        tenantId,
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
    const tenantId = this.tenantContext.tenantId;

    const jobId = await this.queueService.addJob(
      QUEUE_NAMES.LISTING_EXPIRE,
      JOB_TYPES.LISTING_EXPIRE.EXPIRE_BATCH,
      {
        tenantId,
        type: 'listing.expire_batch',
        listingIds: dto.listingIds,
        reason: dto.reason,
      },
    );

    return { jobId };
  }
}
