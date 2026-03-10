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

// Response DTOs for branding info
export class BrandingLogosResponseDto {
  @ApiPropertyOptional({ description: 'Light mode logo URL' })
  light?: string;

  @ApiPropertyOptional({ description: 'Dark mode logo URL' })
  dark?: string;

  @ApiPropertyOptional({ description: 'Favicon/icon URL' })
  icon?: string;
}

export class BrandingColorsResponseDto {
  @ApiPropertyOptional({ description: 'Primary brand color hex' })
  primary?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color hex' })
  secondary?: string;
}

export class CompanyAddressResponseDto {
  @ApiPropertyOptional()
  street?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  country?: string;
}

export class CompanyDetailsResponseDto {
  @ApiPropertyOptional({ description: 'Legal company name' })
  legalName?: string;

  @ApiPropertyOptional({ description: 'Company registration number' })
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Tax identification number' })
  taxId?: string;

  @ApiPropertyOptional({ description: 'Company phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Company email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  website?: string;

  @ApiPropertyOptional({ type: CompanyAddressResponseDto })
  address?: CompanyAddressResponseDto;
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

  @ApiPropertyOptional({ type: BrandingLogosResponseDto, description: 'Logo URLs for different modes' })
  logos?: BrandingLogosResponseDto;

  @ApiPropertyOptional({ type: BrandingColorsResponseDto, description: 'Brand colors' })
  colors?: BrandingColorsResponseDto;

  @ApiPropertyOptional({ type: CompanyDetailsResponseDto, description: 'Company details' })
  company?: CompanyDetailsResponseDto;
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY ADDRESS DTO (nested object)
// ─────────────────────────────────────────────────────────────────────────────

export class CompanyAddressDto {
  @ApiPropertyOptional({ description: 'Street address', example: '123 Main Street, Suite 456' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Kuala Lumpur' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province', example: 'WP Kuala Lumpur' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code', example: '50000' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country code (ISO 3166-1 alpha-2)', example: 'MY' })
  @IsString()
  @IsOptional()
  country?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY DETAILS DTO (nested object for branding.company)
// ─────────────────────────────────────────────────────────────────────────────

export class CompanyDetailsDto {
  @ApiPropertyOptional({ description: 'Legal company name', example: 'Laman Niaga Sdn Bhd' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Business registration number', example: '1234567-A' })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Tax ID / SST number', example: 'W10-1234-56789012' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '+60312345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email address', example: 'contact@company.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Company website', example: 'https://company.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Company address', type: CompanyAddressDto })
  @IsObject()
  @IsOptional()
  address?: CompanyAddressDto;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDING LOGOS DTO (nested object for branding.logos)
// ─────────────────────────────────────────────────────────────────────────────

export class BrandingLogosDto {
  @ApiPropertyOptional({ description: 'Logo URL for light mode', example: 'https://cdn.example.com/logo-light.svg' })
  @IsString()
  @IsOptional()
  light?: string;

  @ApiPropertyOptional({ description: 'Logo URL for dark mode', example: 'https://cdn.example.com/logo-dark.svg' })
  @IsString()
  @IsOptional()
  dark?: string;

  @ApiPropertyOptional({ description: 'Icon URL for light mode (sidebar/favicon)', example: 'https://cdn.example.com/icon-light.png' })
  @IsString()
  @IsOptional()
  iconLight?: string;

  @ApiPropertyOptional({ description: 'Icon URL for dark mode (sidebar/favicon)', example: 'https://cdn.example.com/icon-dark.png' })
  @IsString()
  @IsOptional()
  iconDark?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDING COLORS DTO (nested object for branding.colors)
// ─────────────────────────────────────────────────────────────────────────────

export class BrandingColorsDto {
  @ApiPropertyOptional({ description: 'Primary brand color (hex)', example: '#0066cc' })
  @IsString()
  @IsOptional()
  primary?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color (hex)', example: '#ffffff' })
  @IsString()
  @IsOptional()
  secondary?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PARTNER SETTINGS DTO
// ─────────────────────────────────────────────────────────────────────────────

export class UpdatePartnerSettingsDto {
  @ApiPropertyOptional({ description: 'Partner display name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true, description: 'Custom domain' })
  @IsString()
  @IsOptional()
  domain?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Primary logo URL (deprecated, use logos.light)' })
  @IsString()
  @IsOptional()
  logo?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Enabled vertical types' })
  @IsArray()
  @IsOptional()
  enabledVerticals?: string[];

  @ApiPropertyOptional({ type: 'object', description: 'Feature settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Company & Branding fields
  // ─────────────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ type: CompanyDetailsDto, description: 'Company details' })
  @IsObject()
  @IsOptional()
  company?: CompanyDetailsDto;

  @ApiPropertyOptional({ type: BrandingLogosDto, description: 'Logo URLs for light/dark mode' })
  @IsObject()
  @IsOptional()
  logos?: BrandingLogosDto;

  @ApiPropertyOptional({ type: BrandingColorsDto, description: 'Brand colors' })
  @IsObject()
  @IsOptional()
  colors?: BrandingColorsDto;
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
