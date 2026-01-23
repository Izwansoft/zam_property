import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class ListingQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by listing status',
    enum: ListingStatus,
    example: ListingStatus.PUBLISHED,
  })
  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @ApiPropertyOptional({
    description: 'Filter by vertical type',
    example: 'real_estate',
  })
  @IsString()
  @IsOptional()
  verticalType?: string;

  @ApiPropertyOptional({
    description: 'Filter by vendor ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Search by title (partial match)',
    example: 'condo',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by featured status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 100000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 1000000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Kuala Lumpur',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by state',
    example: 'Selangor',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'price', 'title', 'publishedAt', 'viewCount'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'price', 'title', 'publishedAt', 'viewCount'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
