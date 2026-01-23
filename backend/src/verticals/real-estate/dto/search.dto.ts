/**
 * Real Estate Vertical - Search DTOs
 * Part 29 - Reference Implementation
 */

import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export enum PropertyType {
  APARTMENT = 'apartment',
  CONDOMINIUM = 'condominium',
  TERRACE = 'terrace',
  SEMI_DETACHED = 'semi_detached',
  BUNGALOW = 'bungalow',
  TOWNHOUSE = 'townhouse',
  STUDIO = 'studio',
  PENTHOUSE = 'penthouse',
  DUPLEX = 'duplex',
  VILLA = 'villa',
  SHOP_LOT = 'shop_lot',
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  FACTORY = 'factory',
  LAND = 'land',
  OTHER = 'other',
}

export enum ListingType {
  SALE = 'sale',
  RENT = 'rent',
}

export enum Tenure {
  FREEHOLD = 'freehold',
  LEASEHOLD = 'leasehold',
  MALAY_RESERVE = 'malay_reserve',
  BUMI_LOT = 'bumi_lot',
}

export enum Furnishing {
  UNFURNISHED = 'unfurnished',
  PARTIALLY_FURNISHED = 'partially_furnished',
  FULLY_FURNISHED = 'fully_furnished',
}

export enum PropertyCondition {
  NEW = 'new',
  GOOD = 'good',
  RENOVATED = 'renovated',
  NEEDS_RENOVATION = 'needs_renovation',
}

export enum SortField {
  PRICE_ASC = 'price:asc',
  PRICE_DESC = 'price:desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
  SIZE_ASC = 'size:asc',
  SIZE_DESC = 'size:desc',
  BEDROOMS_ASC = 'bedrooms:asc',
  BEDROOMS_DESC = 'bedrooms:desc',
  RELEVANCE = 'relevance',
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH QUERY DTO
// ─────────────────────────────────────────────────────────────────────────────

export class RealEstateSearchQueryDto {
  // ─── TEXT SEARCH ───────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Search query text',
    example: 'condo near KLCC',
  })
  @IsOptional()
  @IsString()
  q?: string;

  // ─── PROPERTY FILTERS ──────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Property type(s). Can be single value or comma-separated list.',
    example: 'condominium,apartment',
    enum: PropertyType,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  propertyType?: string[];

  @ApiPropertyOptional({
    description: 'Listing type (sale or rent)',
    enum: ListingType,
  })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({
    description: 'Tenure type(s). Can be single value or comma-separated list.',
    enum: Tenure,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  tenure?: string[];

  // ─── ROOM FILTERS ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Minimum number of bedrooms',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedroomsMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of bedrooms',
    example: 4,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedroomsMax?: number;

  @ApiPropertyOptional({
    description: 'Minimum number of bathrooms',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathroomsMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of bathrooms',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathroomsMax?: number;

  // ─── SIZE FILTERS ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Minimum built-up size in sq ft',
    example: 800,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  builtUpSizeMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum built-up size in sq ft',
    example: 2000,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  builtUpSizeMax?: number;

  @ApiPropertyOptional({
    description: 'Minimum land size in sq ft (for landed properties)',
    example: 1500,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  landSizeMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum land size in sq ft (for landed properties)',
    example: 5000,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  landSizeMax?: number;

  // ─── PRICE FILTERS ─────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 300000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 1000000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  // ─── DETAILS FILTERS ───────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Furnishing level(s). Can be single value or comma-separated list.',
    enum: Furnishing,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  furnishing?: string[];

  @ApiPropertyOptional({
    description: 'Property condition(s). Can be single value or comma-separated list.',
    enum: PropertyCondition,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  condition?: string[];

  @ApiPropertyOptional({
    description: 'Minimum year built',
    example: 2010,
    minimum: 1900,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearBuiltMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum year built',
    example: 2025,
    minimum: 1900,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearBuiltMax?: number;

  // ─── FACILITIES & AMENITIES ────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Required facilities (comma-separated)',
    example: 'swimming_pool,gym,security',
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  facilities?: string[];

  @ApiPropertyOptional({
    description: 'Required nearby amenities (comma-separated)',
    example: 'mrt,shopping_mall,school',
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  nearbyAmenities?: string[];

  // ─── LOCATION FILTERS ──────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'City name filter',
    example: 'Kuala Lumpur',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State name filter',
    example: 'Selangor',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country filter',
    example: 'Malaysia',
  })
  @IsOptional()
  @IsString()
  country?: string;

  // ─── GEO SEARCH ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Latitude for geo-search',
    example: 3.139,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude for geo-search',
    example: 101.6869,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({
    description: 'Radius in kilometers for geo-search',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radius?: number;

  // ─── VENDOR & FEATURED ─────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Filter by vendor ID',
  })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Show only featured listings',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featuredOnly?: boolean;

  // ─── SORTING ───────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortField,
    default: SortField.NEWEST,
  })
  @IsOptional()
  @IsString()
  sort?: string;

  // ─── PAGINATION ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
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

  // ─── OPTIONS ───────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Enable search highlighting',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  highlight?: boolean;

  @ApiPropertyOptional({
    description: 'Include distance from geo-point in results',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDistance?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export class RealEstateSearchResultDto {
  @ApiProperty({ description: 'Listing ID' })
  id!: string;

  @ApiProperty({ description: 'Listing title' })
  title!: string;

  @ApiProperty({ description: 'URL slug' })
  slug!: string;

  @ApiProperty({ description: 'Listing price' })
  price!: number | null;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiPropertyOptional({ description: 'Primary image URL' })
  primaryImageUrl?: string;

  @ApiProperty({ description: 'Location information' })
  location!: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @ApiProperty({ description: 'Real estate attributes' })
  attributes!: {
    propertyType: string;
    listingType: string;
    bedrooms?: number;
    bathrooms?: number;
    builtUpSize?: number;
    furnishing?: string;
  };

  @ApiProperty({ description: 'Featured status' })
  isFeatured!: boolean;

  @ApiPropertyOptional({ description: 'Distance in km (if geo-search used)' })
  distance?: number;

  @ApiPropertyOptional({ description: 'Search highlights' })
  highlights?: Record<string, string[]>;

  @ApiProperty({ description: 'Published date' })
  publishedAt!: Date;
}

export class FacetBucketDto {
  @ApiProperty({ description: 'Bucket key' })
  key!: string;

  @ApiProperty({ description: 'Document count' })
  count!: number;

  @ApiPropertyOptional({ description: 'Human-readable label' })
  label?: string;
}

export class RealEstateFacetsDto {
  @ApiProperty({ type: [FacetBucketDto], description: 'Property type facets' })
  propertyType!: FacetBucketDto[];

  @ApiProperty({ type: [FacetBucketDto], description: 'Listing type facets' })
  listingType!: FacetBucketDto[];

  @ApiProperty({ type: [FacetBucketDto], description: 'Bedrooms facets' })
  bedrooms!: FacetBucketDto[];

  @ApiProperty({ type: [FacetBucketDto], description: 'Furnishing facets' })
  furnishing!: FacetBucketDto[];

  @ApiProperty({ type: [FacetBucketDto], description: 'Tenure facets' })
  tenure!: FacetBucketDto[];

  @ApiProperty({ type: [FacetBucketDto], description: 'Price range facets' })
  priceRange!: FacetBucketDto[];

  @ApiProperty({ type: [FacetBucketDto], description: 'City facets' })
  city!: FacetBucketDto[];

  @ApiProperty({ type: [FacetBucketDto], description: 'State facets' })
  state!: FacetBucketDto[];
}

export class RealEstateSearchResponseDto {
  @ApiProperty({ type: [RealEstateSearchResultDto], description: 'Search results' })
  data!: RealEstateSearchResultDto[];

  @ApiProperty({ description: 'Response metadata' })
  meta!: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    facets: RealEstateFacetsDto;
  };
}
