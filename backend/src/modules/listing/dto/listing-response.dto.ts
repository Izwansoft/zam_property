import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { ListingStatus } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

export class ListingMediaResponseDto {
  @ApiProperty({ description: 'Media ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Original filename' })
  filename!: string;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes' })
  size!: number;

  @ApiProperty({ description: 'Media type', enum: ['IMAGE', 'VIDEO', 'DOCUMENT'] })
  mediaType!: string;

  @ApiPropertyOptional({ description: 'CDN URL for the media' })
  cdnUrl?: string | null;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnailUrl?: string | null;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder!: number;

  @ApiProperty({ description: 'Whether this is the primary media' })
  isPrimary!: boolean;

  @ApiPropertyOptional({ description: 'Alt text for accessibility' })
  altText?: string | null;
}

export class ListingVendorResponseDto {
  @ApiProperty({ description: 'Vendor ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Vendor name' })
  name!: string;

  @ApiProperty({ description: 'Vendor slug' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Vendor email' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Vendor phone' })
  phone?: string | null;
}

export class ListingResponseDto {
  @ApiProperty({ description: 'Listing ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Partner ID', format: 'uuid' })
  partnerId!: string;

  @ApiProperty({ description: 'Vendor ID', format: 'uuid' })
  vendorId!: string;

  @ApiProperty({ description: 'Vertical type', example: 'real_estate' })
  verticalType!: string;

  @ApiProperty({ description: 'Schema version', example: '1.0' })
  schemaVersion!: string;

  @ApiProperty({ description: 'Listing title', example: 'Beautiful 3-Bedroom Condo' })
  title!: string;

  @ApiPropertyOptional({ description: 'Listing description' })
  description?: string | null;

  @ApiProperty({ description: 'URL-friendly slug', example: 'beautiful-3-bedroom-condo' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Price' })
  price!: Decimal | null;

  @ApiProperty({ description: 'Currency code', example: 'MYR' })
  currency!: string;

  @ApiPropertyOptional({ description: 'Price type', example: 'FIXED' })
  priceType!: string | null;

  @ApiPropertyOptional({ description: 'Location details (JSON)' })
  location?: Prisma.JsonValue | null;

  @ApiProperty({ description: 'Vertical-specific attributes (JSON)' })
  attributes!: Prisma.JsonValue;

  @ApiProperty({ description: 'Listing status', enum: ListingStatus })
  status!: ListingStatus;

  @ApiPropertyOptional({ description: 'Published timestamp' })
  publishedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Expiry timestamp' })
  expiresAt?: Date | null;

  @ApiProperty({ description: 'Whether listing is featured' })
  isFeatured!: boolean;

  @ApiPropertyOptional({ description: 'Featured until timestamp' })
  featuredUntil?: Date | null;

  @ApiProperty({ description: 'View count' })
  viewCount!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export class ListingDetailResponseDto extends ListingResponseDto {
  @ApiPropertyOptional({ description: 'Vendor details', type: ListingVendorResponseDto })
  vendor?: ListingVendorResponseDto | null;

  @ApiPropertyOptional({
    description: 'Listing media',
    type: [ListingMediaResponseDto],
  })
  media?: ListingMediaResponseDto[];
}
