import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, ManagementType } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

export class AdminListingVendorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class AdminListingDashboardItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  partnerId!: string;

  @ApiProperty({ format: 'uuid' })
  vendorId!: string;

  @ApiProperty({ type: AdminListingVendorDto })
  vendor!: AdminListingVendorDto;

  @ApiProperty({ example: 'real_estate' })
  verticalType!: string;

  @ApiProperty({ enum: ListingStatus })
  status!: ListingStatus;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  price?: Decimal | null;

  @ApiProperty({ example: 'MYR' })
  currency!: string;

  @ApiProperty({ example: false })
  isFeatured!: boolean;

  @ApiProperty({ enum: ManagementType, example: 'SELF_MANAGED' })
  managementType!: ManagementType;

  @ApiProperty({ description: 'Listing attributes JSON (propertyType, listingType, etc.)' })
  attributes!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Primary image URL from media' })
  primaryImage?: string | null;

  @ApiPropertyOptional({ description: 'Assigned agent full name' })
  agentName?: string | null;

  @ApiPropertyOptional({ description: 'Assigned agent company name' })
  agentCompanyName?: string | null;

  @ApiPropertyOptional()
  publishedAt?: Date | null;

  @ApiPropertyOptional()
  expiresAt?: Date | null;

  @ApiProperty({ example: 0 })
  interactionsCount!: number;

  @ApiProperty({ example: 0 })
  reviewsCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
