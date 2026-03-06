import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class PartnerQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ enum: PartnerStatus })
  @IsEnum(PartnerStatus)
  @IsOptional()
  status?: PartnerStatus;

  @ApiPropertyOptional({ enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({ example: 'demo' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'name', 'vendorCount'], default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class PartnerSubscriptionDto {
  @ApiProperty()
  plan!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  currentPeriodStart!: string;

  @ApiProperty()
  currentPeriodEnd!: string;

  @ApiProperty()
  cancelAtPeriodEnd!: boolean;
}

export class PartnerUsageDto {
  @ApiProperty()
  vendorsUsed!: number;

  @ApiProperty()
  vendorsLimit!: number;

  @ApiProperty()
  listingsUsed!: number;

  @ApiProperty()
  listingsLimit!: number;

  @ApiProperty()
  storageUsedMB!: number;

  @ApiProperty()
  storageLimitMB!: number;
}

export class AdminTenantItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  domain!: string | null;

  @ApiProperty({ enum: PartnerStatus })
  status!: PartnerStatus;

  @ApiPropertyOptional()
  logo!: string | null;

  @ApiPropertyOptional({ type: 'object' })
  settings!: Record<string, unknown> | null;

  @ApiProperty({ enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] })
  plan!: string;

  @ApiProperty()
  vendorCount!: number;

  @ApiProperty()
  listingCount!: number;

  @ApiProperty()
  activeListingCount!: number;

  @ApiPropertyOptional()
  adminEmail?: string;

  @ApiPropertyOptional({ type: [String] })
  enabledVerticals?: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AdminTenantDetailDto extends AdminTenantItemDto {
  @ApiProperty()
  adminName!: string;

  @ApiPropertyOptional({ type: PartnerSubscriptionDto })
  subscription?: PartnerSubscriptionDto;

  @ApiPropertyOptional({ type: PartnerUsageDto })
  usage?: PartnerUsageDto;

  @ApiPropertyOptional()
  suspensionReason?: string;

  @ApiPropertyOptional()
  deactivationReason?: string;

  @ApiPropertyOptional()
  lastActivityAt?: string;
}

export class SuspendTenantDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class DeactivateTenantDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class UpdatePartnerSettingsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  domain?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  logo?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  enabledVerticals?: string[];

  @ApiPropertyOptional({ type: 'object' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PARTNER DTO
// ─────────────────────────────────────────────────────────────────────────────

export class CreatePartnerDto {
  @ApiProperty({ description: 'Partner display name', example: 'PropertyPro Malaysia' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'URL-safe slug (unique)', example: 'propertypro-my' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional({ description: 'Branding JSON', type: 'object' })
  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Vertical types to enable', type: [String], example: ['real_estate', 'automotive'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verticalTypes?: string[];

  @ApiProperty({ description: 'Initial admin user email', example: 'admin@propertypro.my' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ description: 'Initial admin user full name', example: 'Admin User' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  adminName!: string;

  @ApiProperty({ description: 'Initial admin password', example: 'SecureP@ss123' })
  @IsString()
  @MinLength(8)
  adminPassword!: string;

  @ApiPropertyOptional({ description: 'Initial admin phone', example: '+60123456789' })
  @IsOptional()
  @IsString()
  adminPhone?: string;
}
