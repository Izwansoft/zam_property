import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context';
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
    private readonly PartnerContext: PartnerContextService,
  ) {}

  /**
   * Create new media record
   */
  async create(params: CreateMediaParams): Promise<Media> {
    const partner = this.PartnerContext.getContext();

    const media = await this.prisma.media.create({
      data: {
        partnerId: partner.partnerId,
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
   * Find media by ID (partner-scoped)
   */
  async findById(id: string): Promise<Media | null> {
    const partner = this.PartnerContext.getContext();

    return this.prisma.media.findFirst({
      where: {
        id,
        partnerId: partner.partnerId,
        deletedAt: null,
      },
    });
  }

  /**
   * Find media by storage key (partner-scoped)
   */
  async findByStorageKey(storageKey: string): Promise<Media | null> {
    const partner = this.PartnerContext.getContext();

    return this.prisma.media.findFirst({
      where: {
        storageKey,
        partnerId: partner.partnerId,
        deletedAt: null,
      },
    });
  }

  /**
   * Find many media (partner-scoped, paginated)
   */
  async findMany(params: FindManyMediaParams): Promise<{ data: Media[]; total: number }> {
    const partner = this.PartnerContext.getContext();
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where = {
      partnerId: partner.partnerId,
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
    const partner = this.PartnerContext.getContext();

    return this.prisma.media.update({
      where: {
        id,
        partnerId: partner.partnerId,
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
    const partner = this.PartnerContext.getContext();

    return this.prisma.media.update({
      where: {
        id,
        partnerId: partner.partnerId,
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
    const partner = this.PartnerContext.getContext();

    await this.prisma.media.delete({
      where: {
        id,
        partnerId: partner.partnerId,
      },
    });
  }

  /**
   * Find media by owner (partner-scoped)
   */
  async findByOwner(ownerType: string, ownerId: string): Promise<Media[]> {
    const partner = this.PartnerContext.getContext();

    return this.prisma.media.findMany({
      where: {
        partnerId: partner.partnerId,
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
    const partner = this.PartnerContext.getContext();

    return this.prisma.media.count({
      where: {
        partnerId: partner.partnerId,
        ownerType,
        ownerId,
        deletedAt: null,
      },
    });
  }
}
