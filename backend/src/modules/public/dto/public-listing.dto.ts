/**
 * Public Listing DTOs
 * Session 4.3 - Public API & Rate Limiting
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicListingMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiProperty()
  mediaType!: string;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty()
  sortOrder!: number;
}

export class PublicListingVendorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;
}

export class PublicListingLocationDto {
  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;
}

export class PublicListingDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  verticalType!: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  priceType?: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  publishedAt!: string;

  @ApiPropertyOptional({ type: PublicListingLocationDto })
  location?: PublicListingLocationDto;

  @ApiPropertyOptional({ type: 'object' })
  attributes?: Record<string, unknown>;

  @ApiProperty({ type: [PublicListingMediaDto] })
  media!: PublicListingMediaDto[];

  @ApiProperty({ type: PublicListingVendorDto })
  vendor!: PublicListingVendorDto;
}

export class PublicListingResponseDto {
  @ApiProperty({ type: PublicListingDetailDto })
  data!: PublicListingDetailDto;

  @ApiProperty()
  meta!: {
    requestId: string;
  };
}
