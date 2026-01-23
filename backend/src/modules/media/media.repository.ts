import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { TenantContextService } from '@core/tenant-context';
import { MediaType, MediaVisibility, Media, Prisma, ProcessingStatus } from '@prisma/client';

export interface CreateMediaParams {
  ownerType: string;
  ownerId: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaType: MediaType;
  storageKey: string;
  visibility: MediaVisibility;
  sortOrder?: number;
}

export interface UpdateMediaParams {
  sortOrder?: number;
  isPrimary?: boolean;
  visibility?: MediaVisibility;
  metadata?: Prisma.InputJsonValue;
  processingStatus?: ProcessingStatus;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  cdnUrl?: string;
}

export interface FindManyMediaParams {
  ownerType?: string;
  ownerId?: string;
  mediaType?: MediaType;
  visibility?: MediaVisibility;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class MediaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create new media record
   */
  async create(params: CreateMediaParams): Promise<Media> {
    const tenant = this.tenantContext.getContext();

    const media = await this.prisma.media.create({
      data: {
        tenantId: tenant.tenantId,
        ownerType: params.ownerType,
        ownerId: params.ownerId,
        filename: params.filename,
        mimeType: params.mimeType,
        size: params.size,
        mediaType: params.mediaType,
        storageKey: params.storageKey,
        visibility: params.visibility,
        sortOrder: params.sortOrder || 0,
        processingStatus: 'PENDING',
      },
    });

    return media;
  }

  /**
   * Find media by ID (tenant-scoped)
   */
  async findById(id: string): Promise<Media | null> {
    const tenant = this.tenantContext.getContext();

    return this.prisma.media.findFirst({
      where: {
        id,
        tenantId: tenant.tenantId,
        deletedAt: null,
      },
    });
  }

  /**
   * Find media by storage key (tenant-scoped)
   */
  async findByStorageKey(storageKey: string): Promise<Media | null> {
    const tenant = this.tenantContext.getContext();

    return this.prisma.media.findFirst({
      where: {
        storageKey,
        tenantId: tenant.tenantId,
        deletedAt: null,
      },
    });
  }

  /**
   * Find many media (tenant-scoped, paginated)
   */
  async findMany(params: FindManyMediaParams): Promise<{ data: Media[]; total: number }> {
    const tenant = this.tenantContext.getContext();
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId: tenant.tenantId,
      deletedAt: null,
      ...(params.ownerType && { ownerType: params.ownerType }),
      ...(params.ownerId && { ownerId: params.ownerId }),
      ...(params.mediaType && { mediaType: params.mediaType }),
      ...(params.visibility && { visibility: params.visibility }),
    };

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.media.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Update media metadata
   */
  async update(id: string, params: UpdateMediaParams): Promise<Media> {
    const tenant = this.tenantContext.getContext();

    return this.prisma.media.update({
      where: {
        id,
        tenantId: tenant.tenantId,
      },
      data: {
        ...params,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete media
   */
  async softDelete(id: string): Promise<Media> {
    const tenant = this.tenantContext.getContext();

    return this.prisma.media.update({
      where: {
        id,
        tenantId: tenant.tenantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Hard delete media (use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const tenant = this.tenantContext.getContext();

    await this.prisma.media.delete({
      where: {
        id,
        tenantId: tenant.tenantId,
      },
    });
  }

  /**
   * Find media by owner (tenant-scoped)
   */
  async findByOwner(ownerType: string, ownerId: string): Promise<Media[]> {
    const tenant = this.tenantContext.getContext();

    return this.prisma.media.findMany({
      where: {
        tenantId: tenant.tenantId,
        ownerType,
        ownerId,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Count media by owner
   */
  async countByOwner(ownerType: string, ownerId: string): Promise<number> {
    const tenant = this.tenantContext.getContext();

    return this.prisma.media.count({
      where: {
        tenantId: tenant.tenantId,
        ownerType,
        ownerId,
        deletedAt: null,
      },
    });
  }
}
