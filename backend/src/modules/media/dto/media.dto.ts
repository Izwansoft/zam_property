import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType, MediaVisibility } from '@prisma/client';

export class RequestPresignedUrlDto {
  @ApiProperty({ description: 'Original filename', example: 'house-photo.jpg' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes', example: 2048576 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size!: number;

  @ApiProperty({
    description: 'Owner type (polymorphic)',
    example: 'listing',
    enum: ['listing', 'vendor', 'user'],
  })
  @IsString()
  @IsNotEmpty()
  ownerType!: string;

  @ApiProperty({ description: 'Owner ID (UUID)', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  ownerId!: string;

  @ApiPropertyOptional({
    description: 'Visibility',
    enum: MediaVisibility,
    default: MediaVisibility.PUBLIC,
  })
  @IsEnum(MediaVisibility)
  @IsOptional()
  visibility?: MediaVisibility;
}

export class ConfirmUploadDto {
  @ApiProperty({
    description: 'Storage key from presigned URL response',
    example: 'media/partner-id/uuid.jpg',
  })
  @IsString()
  @IsNotEmpty()
  storageKey!: string;
}

export class UpdateMediaDto {
  @ApiPropertyOptional({ description: 'Alt text for accessibility' })
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is primary media' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Visibility', enum: MediaVisibility })
  @IsEnum(MediaVisibility)
  @IsOptional()
  visibility?: MediaVisibility;

  @ApiPropertyOptional({ description: 'Custom metadata (JSON)' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class MediaQueryDto {
  @ApiPropertyOptional({ description: 'Owner type filter', example: 'listing' })
  @IsString()
  @IsOptional()
  ownerType?: string;

  @ApiPropertyOptional({ description: 'Owner ID filter', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Media type filter', enum: MediaType })
  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @ApiPropertyOptional({ description: 'Visibility filter', enum: MediaVisibility })
  @IsEnum(MediaVisibility)
  @IsOptional()
  visibility?: MediaVisibility;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;
}
