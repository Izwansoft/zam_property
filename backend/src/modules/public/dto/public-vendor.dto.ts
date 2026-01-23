/**
 * Public Vendor DTOs
 * Session 4.3 - Public API & Rate Limiting
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicVendorListingPreviewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional()
  primaryImageUrl?: string;

  @ApiProperty()
  verticalType!: string;

  @ApiProperty()
  isFeatured!: boolean;
}

export class PublicVendorRatingDto {
  @ApiProperty()
  averageRating!: number;

  @ApiProperty()
  totalReviews!: number;

  @ApiProperty()
  ratingBreakdown!: Record<number, number>;
}

export class PublicVendorProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiProperty()
  totalListings!: number;

  @ApiProperty({ type: PublicVendorRatingDto })
  ratings!: PublicVendorRatingDto;

  @ApiProperty({ type: [PublicVendorListingPreviewDto] })
  featuredListings!: PublicVendorListingPreviewDto[];

  @ApiProperty()
  memberSince!: string;
}

export class PublicVendorResponseDto {
  @ApiProperty({ type: PublicVendorProfileDto })
  data!: PublicVendorProfileDto;

  @ApiProperty()
  meta!: {
    requestId: string;
  };
}
