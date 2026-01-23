import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsObject,
  IsArray,
  IsDateString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class PlanEntitlementsDto {
  @ApiPropertyOptional({
    description: 'Listing limits configuration',
    example: { limit: 50, verticals: { real_estate: 30, automotive: 20 } },
  })
  @IsOptional()
  @IsObject()
  listings?: {
    limit?: number;
    verticals?: Record<string, number>;
  };

  @ApiPropertyOptional({
    description: 'Interaction/lead limits',
    example: { limit: 100 },
  })
  @IsOptional()
  @IsObject()
  interactions?: {
    limit?: number;
  };

  @ApiPropertyOptional({
    description: 'Media upload and storage limits',
    example: { uploadLimit: 500, storageLimit: 10 },
  })
  @IsOptional()
  @IsObject()
  media?: {
    uploadLimit?: number;
    storageLimit?: number;
  };

  @ApiPropertyOptional({
    description: 'Feature flags enabled for this plan',
    example: ['analytics', 'featured_listings', 'priority_support'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Allowed verticals',
    example: ['real_estate', 'automotive'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verticals?: string[];

  @ApiPropertyOptional({
    description: 'API rate limits',
    example: { requestsPerMinute: 60 },
  })
  @IsOptional()
  @IsObject()
  api?: {
    requestsPerMinute?: number;
  };

  // Allow additional properties for flexibility
  [key: string]: unknown;
}

export class CreatePlanDto {
  @ApiProperty({ description: 'Plan name', example: 'Professional' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'professional' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Full-featured plan for growing businesses',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Monthly price',
    example: 199.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional({
    description: 'Yearly price',
    example: 1990.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceYearly?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'MYR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Plan entitlements and limits',
    type: PlanEntitlementsDto,
  })
  @ValidateNested()
  @Type(() => PlanEntitlementsDto)
  entitlements!: PlanEntitlementsDto;

  @ApiPropertyOptional({
    description: 'Whether plan is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether plan is publicly visible',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Plan name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Monthly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional({ description: 'Yearly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceYearly?: number;

  @ApiPropertyOptional({
    description: 'Plan entitlements',
    type: PlanEntitlementsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanEntitlementsDto)
  entitlements?: PlanEntitlementsDto;

  @ApiPropertyOptional({ description: 'Whether plan is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether plan is publicly visible' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class PlanQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by public visibility',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class AssignSubscriptionDto {
  @ApiProperty({
    description: 'Plan ID to assign',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  planId!: string;

  @ApiPropertyOptional({
    description: 'Subscription start date (ISO 8601)',
    example: '2026-01-20T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @ApiPropertyOptional({
    description: 'Subscription end date (ISO 8601)',
    example: '2026-02-20T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;

  @ApiPropertyOptional({
    description: 'External billing provider subscription ID',
    example: 'sub_1234567890',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'External billing provider name',
    example: 'stripe',
  })
  @IsOptional()
  @IsString()
  externalProvider?: string;

  @ApiPropertyOptional({
    description: 'Enterprise overrides for entitlements',
    example: { listings: { limit: 1000 } },
  })
  @IsOptional()
  @IsObject()
  overrides?: Record<string, unknown>;
}

export class UpdateSubscriptionStatusDto {
  @ApiProperty({
    description: 'New subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.PAST_DUE,
  })
  @IsEnum(SubscriptionStatus)
  status!: SubscriptionStatus;
}

export class ChangePlanDto {
  @ApiProperty({
    description: 'New plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  newPlanId!: string;

  @ApiPropertyOptional({
    description: 'Effective date for plan change (defaults to immediate)',
    example: '2026-02-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class IncrementUsageDto {
  @ApiProperty({
    description: 'Metric key to increment',
    example: 'listing.create.real_estate',
  })
  @IsString()
  metricKey!: string;

  @ApiPropertyOptional({
    description: 'Amount to increment by (defaults to 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}

export class GetUsageDto {
  @ApiProperty({
    description: 'Metric key to query',
    example: 'listing.create.real_estate',
  })
  @IsString()
  metricKey!: string;

  @ApiPropertyOptional({
    description: 'Period start date (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({
    description: 'Period end date (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
