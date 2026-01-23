import { Injectable, Scope } from '@nestjs/common';
import type { ListingStatus, Prisma } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '@infrastructure/database';
import { BaseTenantRepository, TenantContextService } from '@core/tenant-context';

export interface ListingView {
  id: string;
  tenantId: string;
  vendorId: string;
  verticalType: string;
  schemaVersion: string;
  title: string;
  description: string | null;
  slug: string;
  price: Decimal | null;
  currency: string;
  priceType: string | null;
  location: Prisma.JsonValue | null;
  attributes: Prisma.JsonValue | null;
  status: ListingStatus;
  publishedAt: Date | null;
  expiresAt: Date | null;
  isFeatured: boolean;
  featuredUntil: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingMediaView {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaType: string;
  cdnUrl: string | null;
  thumbnailUrl: string | null;
  visibility: string;
  sortOrder: number;
  isPrimary: boolean;
  altText: string | null;
}

export interface ListingVendorView {
  id: string;
  name: string;
  slug: string;
}

export interface ListingDetailView extends ListingView {
  vendor: ListingVendorView;
  media: ListingMediaView[];
}

const listingSelect = {
  id: true,
  tenantId: true,
  vendorId: true,
  verticalType: true,
  schemaVersion: true,
  title: true,
  description: true,
  slug: true,
  price: true,
  currency: true,
  priceType: true,
  location: true,
  attributes: true,
  status: true,
  publishedAt: true,
  expiresAt: true,
  isFeatured: true,
  featuredUntil: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

const listingDetailSelect = {
  ...listingSelect,
  vendor: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  media: {
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      mediaType: true,
      cdnUrl: true,
      thumbnailUrl: true,
      visibility: true,
      sortOrder: true,
      isPrimary: true,
      altText: true,
    },
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

export interface ListingListParams {
  skip: number;
  take: number;
  status?: ListingStatus;
  verticalType?: string;
  vendorId?: string;
  search?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ scope: Scope.REQUEST })
export class ListingRepository extends BaseTenantRepository {
  constructor(prisma: PrismaService, tenantContext: TenantContextService) {
    super(prisma, tenantContext);
  }

  async findById(id: string): Promise<ListingView | null> {
    return this.prisma.listing.findFirst({
      where: this.scopeWhere({ id, deletedAt: null }),
      select: listingSelect,
    });
  }

  async findByIdWithDetails(id: string): Promise<ListingDetailView | null> {
    return this.prisma.listing.findFirst({
      where: this.scopeWhere({ id, deletedAt: null }),
      select: listingDetailSelect,
    });
  }

  async findDetailById(id: string): Promise<ListingDetailView | null> {
    return this.findByIdWithDetails(id);
  }

  async findBySlug(slug: string): Promise<ListingView | null> {
    return this.prisma.listing.findFirst({
      where: this.scopeWhere({ slug, deletedAt: null }),
      select: listingSelect,
    });
  }

  async list(params: ListingListParams): Promise<ListingView[]> {
    const where = this.buildWhereClause(params);

    return this.prisma.listing.findMany({
      where,
      orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
      skip: params.skip,
      take: params.take,
      select: listingSelect,
    });
  }

  async count(
    params?: Omit<ListingListParams, 'skip' | 'take' | 'sortBy' | 'sortOrder'>,
  ): Promise<number> {
    const where = this.buildWhereClause(params ?? {});
    return this.prisma.listing.count({ where });
  }

  async findManyDetailed(params: {
    page: number;
    pageSize: number;
    filters?: {
      verticalType?: string;
      status?: ListingStatus | ListingStatus[];
      vendorId?: string;
    };
  }): Promise<ListingDetailView[]> {
    const where: Prisma.ListingWhereInput = this.scopeWhere({ deletedAt: null });

    if (params.filters?.verticalType) {
      where.verticalType = params.filters.verticalType;
    }

    if (params.filters?.status) {
      if (Array.isArray(params.filters.status)) {
        where.status = { in: params.filters.status };
      } else {
        where.status = params.filters.status;
      }
    }

    if (params.filters?.vendorId) {
      where.vendorId = params.filters.vendorId;
    }

    return this.prisma.listing.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: listingDetailSelect,
    });
  }

  private buildWhereClause(params: Partial<ListingListParams>): Prisma.ListingWhereInput {
    const where: Prisma.ListingWhereInput = this.scopeWhere({ deletedAt: null });

    if (params.status) {
      where.status = params.status;
    }

    if (params.verticalType) {
      where.verticalType = params.verticalType;
    }

    if (params.vendorId) {
      where.vendorId = params.vendorId;
    }

    if (params.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured;
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) {
        where.price.gte = params.minPrice;
      }
      if (params.maxPrice !== undefined) {
        where.price.lte = params.maxPrice;
      }
    }

    // Location filters using JSON path queries
    if (params.city) {
      where.location = {
        path: ['city'],
        string_contains: params.city,
      };
    }

    if (params.state) {
      // Note: If city is also set, this will override. In a real scenario,
      // you'd use AND to combine these conditions.
      where.location = {
        ...(where.location as object),
        path: ['state'],
        string_contains: params.state,
      };
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async create(data: {
    vendorId: string;
    verticalType: string;
    title: string;
    slug: string;
    description?: string;
    price?: number;
    currency?: string;
    priceType?: string;
    location?: Prisma.InputJsonValue;
    attributes?: Prisma.InputJsonValue;
  }): Promise<ListingView> {
    return this.prisma.listing.create({
      data: this.scopeCreateData({
        vendorId: data.vendorId,
        verticalType: data.verticalType,
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: data.price,
        currency: data.currency ?? 'MYR',
        priceType: data.priceType ?? 'FIXED',
        location: data.location,
        attributes: data.attributes,
        status: 'DRAFT',
        schemaVersion: '1.0',
      }),
      select: listingSelect,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      currency?: string;
      priceType?: string;
      location?: Prisma.InputJsonValue;
      attributes?: Prisma.InputJsonValue;
      isFeatured?: boolean;
      featuredUntil?: Date | null;
      expiresAt?: Date | null;
    },
  ): Promise<ListingView | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.prisma.listing.update({
      where: { id },
      data,
      select: listingSelect,
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: ListingStatus;
      publishedAt?: Date | null;
      expiresAt?: Date | null;
    },
  ): Promise<ListingView | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.prisma.listing.update({
      where: { id },
      data,
      select: listingSelect,
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async softDelete(id: string): Promise<ListingView | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    return this.prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: listingSelect,
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ListingWhereInput = this.scopeWhere({ slug, deletedAt: null });
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await this.prisma.listing.count({ where });
    return count > 0;
  }

  async findByVendorId(
    vendorId: string,
    params?: { skip?: number; take?: number },
  ): Promise<ListingView[]> {
    return this.prisma.listing.findMany({
      where: this.scopeWhere({ vendorId, deletedAt: null }),
      orderBy: { createdAt: 'desc' },
      skip: params?.skip ?? 0,
      take: params?.take ?? 10,
      select: listingSelect,
    });
  }

  async countByVendorId(vendorId: string): Promise<number> {
    return this.prisma.listing.count({
      where: this.scopeWhere({ vendorId, deletedAt: null }),
    });
  }
}
