/**
 * Vertical Registry DTOs
 * Part 8 - Vertical Module Contract
 */

import { IsString, IsOptional, IsBoolean, IsObject, IsArray, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL DEFINITION DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateVerticalDefinitionDto {
  @ApiProperty({
    description: 'Unique vertical type identifier',
    example: 'real_estate',
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Human-readable name',
    example: 'Real Estate',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Vertical description',
    example: 'Property listings including residential, commercial, and land',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier or URL',
    example: 'home',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Brand color (hex)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'JSON Schema for listing attributes',
    example: {
      version: '1.0',
      fields: [
        {
          name: 'propertyType',
          type: 'enum',
          label: 'Property Type',
          required: true,
          options: [
            { value: 'house', label: 'House' },
            { value: 'condo', label: 'Condominium' },
          ],
        },
      ],
    },
  })
  @IsObject()
  attributeSchema!: Record<string, unknown>;

  @ApiProperty({
    description: 'Validation rules configuration',
    example: {
      version: '1.0',
      rules: [
        {
          id: 'bedrooms-required-on-publish',
          type: 'requiredOnPublish',
          field: 'bedrooms',
          message: 'Bedrooms is required before publishing',
        },
      ],
    },
  })
  @IsObject()
  validationRules!: Record<string, unknown>;

  @ApiProperty({
    description: 'OpenSearch mapping for this vertical',
    example: {
      version: '1.0',
      properties: {
        propertyType: { name: 'propertyType', type: 'keyword' },
        bedrooms: { name: 'bedrooms', type: 'integer' },
      },
    },
  })
  @IsObject()
  searchMapping!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Supported listing statuses',
    example: ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'],
    default: ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedStatuses?: string[];

  @ApiPropertyOptional({
    description: 'Display metadata for UI rendering',
    example: {
      version: '1.0',
      cardView: {
        titleField: 'title',
        priceField: 'price',
        locationField: 'location.city',
      },
    },
  })
  @IsOptional()
  @IsObject()
  displayMetadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Schema version for migrations',
    example: '1.0',
    default: '1.0',
  })
  @IsOptional()
  @IsString()
  schemaVersion?: string;

  @ApiPropertyOptional({
    description: 'Whether the vertical is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a core vertical (cannot be disabled)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isCore?: boolean;
}

export class UpdateVerticalDefinitionDto extends PartialType(CreateVerticalDefinitionDto) {
  // type cannot be updated
  @ApiProperty({ description: 'Vertical type (read-only)' })
  @IsOptional()
  type?: never;
}

// ─────────────────────────────────────────────────────────────────────────────
// TENANT VERTICAL DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class EnableVerticalDto {
  @ApiProperty({
    description: 'Vertical type to enable',
    example: 'real_estate',
  })
  @IsString()
  verticalType!: string;

  @ApiPropertyOptional({
    description: 'Configuration overrides for this tenant',
    example: { allowCustomFields: true },
  })
  @IsOptional()
  @IsObject()
  configOverrides?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Tenant-specific custom fields',
    example: [
      {
        name: 'customField1',
        type: 'string',
        label: 'Custom Field',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  customFields?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({
    description: 'Override listing limit for this vertical',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  listingLimit?: number;
}

export class UpdateTenantVerticalDto {
  @ApiPropertyOptional({
    description: 'Configuration overrides',
  })
  @IsOptional()
  @IsObject()
  configOverrides?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Custom fields',
  })
  @IsOptional()
  @IsArray()
  customFields?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({
    description: 'Listing limit override',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  listingLimit?: number;

  @ApiPropertyOptional({
    description: 'Enable/disable the vertical',
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class VerticalQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by core status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isCore?: boolean;
}

export class TenantVerticalQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by enabled status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by vertical type',
    example: 'real_estate',
  })
  @IsOptional()
  @IsString()
  verticalType?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class VerticalDefinitionResponseDto {
  @ApiProperty({ description: 'Vertical ID' })
  id!: string;

  @ApiProperty({ description: 'Vertical type identifier', example: 'real_estate' })
  type!: string;

  @ApiProperty({ description: 'Human-readable name', example: 'Real Estate' })
  name!: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Icon' })
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Brand color' })
  color?: string | null;

  @ApiProperty({ description: 'Attribute schema' })
  attributeSchema!: Prisma.JsonValue;

  @ApiProperty({ description: 'Validation rules' })
  validationRules!: Prisma.JsonValue;

  @ApiProperty({ description: 'Search mapping' })
  searchMapping!: Prisma.JsonValue;

  @ApiProperty({ description: 'Supported statuses' })
  supportedStatuses!: string[];

  @ApiPropertyOptional({ description: 'Display metadata' })
  displayMetadata?: Prisma.JsonValue | null;

  @ApiProperty({ description: 'Schema version' })
  schemaVersion!: string;

  @ApiProperty({ description: 'Is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Is core vertical' })
  isCore!: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt!: Date;
}

export class TenantVerticalResponseDto {
  @ApiProperty({ description: 'Tenant Vertical ID' })
  id!: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId!: string;

  @ApiProperty({ description: 'Vertical ID' })
  verticalId!: string;

  @ApiPropertyOptional({ description: 'Configuration overrides' })
  configOverrides?: Prisma.JsonValue | null;

  @ApiPropertyOptional({ description: 'Custom fields' })
  customFields?: Prisma.JsonValue | null;

  @ApiPropertyOptional({ description: 'Listing limit override' })
  listingLimit?: number | null;

  @ApiProperty({ description: 'Is enabled' })
  isEnabled!: boolean;

  @ApiProperty({ description: 'Enabled timestamp' })
  enabledAt!: Date;

  @ApiPropertyOptional({ description: 'Disabled timestamp' })
  disabledAt?: Date | null;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Vertical definition (when included)' })
  vertical?: VerticalDefinitionResponseDto;
}

export class TenantVerticalSummaryDto {
  @ApiProperty({ description: 'Vertical type', example: 'real_estate' })
  type!: string;

  @ApiProperty({ description: 'Vertical name', example: 'Real Estate' })
  name!: string;

  @ApiProperty({ description: 'Is enabled for tenant' })
  isEnabled!: boolean;

  @ApiPropertyOptional({ description: 'Listing limit' })
  listingLimit?: number | null;

  @ApiPropertyOptional({ description: 'Current listing count' })
  listingCount?: number;
}
