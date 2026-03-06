/**
 * Public Search DTOs
 * Session 4.3 - Public API & Rate Limiting
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, IsEnum } from 'class-validator';

export enum PublicSearchSortField {
  RELEVANCE = 'relevance',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class PublicSearchQueryDto {
  @ApiPropertyOptional({ description: 'Search query text' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by vertical type', example: 'real_estate' })
  @IsOptional()
  @IsString()
  verticalType?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by country', default: 'MY' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude for geo search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for geo search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Radius in km for geo search', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(500)
  radius?: number;

  @ApiPropertyOptional({ description: 'Listing type: sale or rent', example: 'rent' })
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional({ description: 'Property type filter', example: 'condominium' })
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional({ description: 'Minimum bedrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedroomsMin?: number;

  @ApiPropertyOptional({ description: 'Only featured listings' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featuredOnly?: boolean;

  @ApiPropertyOptional({ description: 'Sort field', enum: PublicSearchSortField })
  @IsOptional()
  @IsEnum(PublicSearchSortField)
  sort?: PublicSearchSortField;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Include search highlights' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  highlight?: boolean;
}

export class PublicSearchResultDto {
  id!: string;
  title!: string;
  slug!: string;
  price!: number | null;
  currency!: string;
  primaryImageUrl?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  verticalType!: string;
  attributes?: Record<string, unknown>;
  vendor!: {
    id: string;
    name: string;
    slug: string;
  };
  isFeatured!: boolean;
  publishedAt!: string;
  highlights?: Record<string, string[]>;
}

export class PublicSearchResponseDto {
  data!: PublicSearchResultDto[];
  meta!: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    facets?: Record<string, { value: string; count: number }[]>;
  };
}
