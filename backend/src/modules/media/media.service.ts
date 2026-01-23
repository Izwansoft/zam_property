import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Prisma } from '@prisma/client';
import { S3Service } from '../../infrastructure/storage/s3.service';
import { MediaRepository } from './media.repository';
import { TenantContextService } from '@core/tenant-context';
import {
  RequestPresignedUrlDto,
  ConfirmUploadDto,
  UpdateMediaDto,
  MediaQueryDto,
} from './dto/media.dto';
import { PresignedUploadResponse, MediaRecord } from './types/media.types';
import { MediaType, MediaVisibility } from '@prisma/client';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  // Allowed MIME types
  private readonly ALLOWED_MIME_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    VIDEO: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  };

  // Max file sizes (bytes)
  private readonly MAX_FILE_SIZES = {
    IMAGE: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    DOCUMENT: 20 * 1024 * 1024, // 20MB
  };

  constructor(
    private readonly s3Service: S3Service,
    private readonly mediaRepository: MediaRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Request presigned URL for upload
   * Step 1 of upload flow: Client requests URL, backend generates presigned URL and creates pending media record
   */
  async requestPresignedUrl(dto: RequestPresignedUrlDto): Promise<PresignedUploadResponse> {
    const tenant = this.tenantContext.getContext();

    // Validate MIME type and size
    const mediaType = this.detectMediaType(dto.mimeType);
    this.validateMimeType(dto.mimeType, mediaType);
    this.validateFileSize(dto.size, mediaType);

    // Generate storage key
    const storageKey = this.generateStorageKey(
      tenant.tenantId,
      dto.ownerType,
      dto.ownerId,
      dto.filename,
    );

    // Create media record in PENDING state
    const media = await this.mediaRepository.create({
      ownerType: dto.ownerType,
      ownerId: dto.ownerId,
      filename: dto.filename,
      mimeType: dto.mimeType,
      size: dto.size,
      mediaType,
      storageKey,
      visibility: dto.visibility || MediaVisibility.PUBLIC,
    });

    // Generate presigned upload URL
    const { url, expiresAt } = await this.s3Service.getPresignedUploadUrl({
      key: storageKey,
      contentType: dto.mimeType,
      expiresIn: 3600, // 1 hour
    });

    this.logger.log(`Presigned URL generated for media ${media.id}, key: ${storageKey}`);

    return {
      uploadUrl: url,
      storageKey,
      expiresAt,
      mediaId: media.id,
    };
  }

  /**
   * Confirm upload completion
   * Step 2 of upload flow: Client confirms upload, backend verifies S3 object exists and updates media record
   */
  async confirmUpload(mediaId: string, dto: ConfirmUploadDto): Promise<MediaRecord> {
    // Find media record
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Verify storage key matches
    if (media.storageKey !== dto.storageKey) {
      throw new BadRequestException('Storage key mismatch');
    }

    // Verify object exists in S3
    const exists = await this.s3Service.objectExists(dto.storageKey);
    if (!exists) {
      throw new BadRequestException('File not found in storage');
    }

    // Get file metadata from S3
    const metadata = await this.s3Service.getMetadata(dto.storageKey);

    // Update media record to COMPLETED status
    const cdnUrl =
      media.visibility === MediaVisibility.PUBLIC
        ? this.s3Service.getPublicUrl(dto.storageKey)
        : undefined;

    const updated = await this.mediaRepository.update(mediaId, {
      processingStatus: 'COMPLETED',
      cdnUrl,
      metadata: {
        size: metadata.size,
        contentType: metadata.contentType,
      },
    });

    this.logger.log(`Upload confirmed for media ${mediaId}`);

    return updated as MediaRecord;
  }

  /**
   * Find all media (paginated, filtered)
   */
  async findAll(
    query: MediaQueryDto,
  ): Promise<{ data: MediaRecord[]; total: number; page: number; pageSize: number }> {
    const { data, total } = await this.mediaRepository.findMany({
      ownerType: query.ownerType,
      ownerId: query.ownerId,
      mediaType: query.mediaType,
      visibility: query.visibility,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: data as MediaRecord[],
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    };
  }

  /**
   * Find media by ID
   */
  async findById(id: string): Promise<MediaRecord> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media as MediaRecord;
  }

  /**
   * Update media metadata
   */
  async update(id: string, dto: UpdateMediaDto): Promise<MediaRecord> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const updated = await this.mediaRepository.update(id, {
      ...dto,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    });
    this.logger.log(`Media ${id} updated`);

    return updated as MediaRecord;
  }

  /**
   * Delete media (soft delete in DB + optionally delete from S3)
   */
  async delete(id: string, deleteFromStorage = true): Promise<void> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Soft delete in database
    await this.mediaRepository.softDelete(id);

    // Optionally delete from S3 (can be async job for cleanup)
    if (deleteFromStorage) {
      try {
        await this.s3Service.deleteObject(media.storageKey);
        this.logger.log(`Deleted media ${id} from storage`);
      } catch (error) {
        this.logger.error(`Failed to delete media ${id} from storage:`, error);
        // Don't throw - soft delete already succeeded
      }
    }

    this.logger.log(`Media ${id} deleted`);
  }

  /**
   * Generate storage key for media
   * Format: media/{tenantId}/{ownerType}/{ownerId}/{uuid}{ext}
   */
  private generateStorageKey(
    tenantId: string,
    ownerType: string,
    ownerId: string,
    filename: string,
  ): string {
    const uuid = randomUUID();
    const ext = extname(filename);
    return `media/${tenantId}/${ownerType}/${ownerId}/${uuid}${ext}`;
  }

  /**
   * Detect media type from MIME type
   */
  private detectMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (
      mimeType.startsWith('application/') &&
      (mimeType.includes('pdf') || mimeType.includes('word'))
    ) {
      return MediaType.DOCUMENT;
    }

    throw new BadRequestException(`Unsupported MIME type: ${mimeType}`);
  }

  /**
   * Validate MIME type is allowed
   */
  private validateMimeType(mimeType: string, mediaType: MediaType): void {
    const allowed = this.ALLOWED_MIME_TYPES[mediaType];
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(`MIME type ${mimeType} not allowed for ${mediaType}`);
    }
  }

  /**
   * Validate file size
   */
  private validateFileSize(size: number, mediaType: MediaType): void {
    const maxSize = this.MAX_FILE_SIZES[mediaType];
    if (size > maxSize) {
      throw new BadRequestException(
        `File size ${size} bytes exceeds maximum ${maxSize} bytes for ${mediaType}`,
      );
    }
  }
}
