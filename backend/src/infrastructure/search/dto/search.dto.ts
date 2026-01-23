import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchListingsQueryDto {
  @ApiProperty({ required: false, description: 'Search query text' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false, description: 'Vertical type filter', example: 'real_estate' })
  @IsOptional()
  @IsString()
  verticalType?: string;

  @ApiProperty({
    required: false,
    description: 'Listing status filter',
    example: 'PUBLISHED',
    default: 'PUBLISHED',
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'])
  status?: string;

  @ApiProperty({ required: false, description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiProperty({ required: false, description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiProperty({ required: false, description: 'City filter' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'State filter' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false, description: 'Country filter' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, description: 'Latitude for geo-search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiProperty({ required: false, description: 'Longitude for geo-search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiProperty({ required: false, description: 'Radius in kilometers for geo-search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radius?: number;

  @ApiProperty({ required: false, description: 'Vendor ID filter' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiProperty({ required: false, description: 'Show only featured listings', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featuredOnly?: boolean;

  @ApiProperty({ required: false, description: 'Sort field and order', example: 'price:asc' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({ required: false, description: 'Page number (1-indexed)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    required: false,
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiProperty({ required: false, description: 'Enable search highlighting', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  highlight?: boolean;

  // Dynamic attribute filters (e.g., ?attr.bedrooms=3)
  // These will be parsed manually in the controller
  [key: string]: unknown;
}

export class SuggestionsQueryDto {
  @ApiProperty({ required: true, description: 'Search prefix' })
  @IsString()
  q!: string;

  @ApiProperty({
    required: false,
    description: 'Maximum suggestions',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
