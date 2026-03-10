import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PricingModel, ChargeType } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Config DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreatePricingConfigDto {
  @ApiProperty({ enum: PricingModel })
  @IsEnum(PricingModel)
  @IsNotEmpty()
  model!: PricingModel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'JSON configuration for the pricing model',
    example: { monthlyFee: 99, yearlyFee: 999, features: ['feature1', 'feature2'] },
  })
  @IsObject()
  @IsNotEmpty()
  config!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  verticalId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePricingConfigDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Rule DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreatePricingRuleDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  pricingConfigId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Event type that triggers this rule',
    example: 'interaction.created',
  })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({ enum: ChargeType })
  @IsEnum(ChargeType)
  @IsNotEmpty()
  chargeType!: ChargeType;

  @ApiProperty({
    description: 'Amount in currency (or percentage for commission)',
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'MYR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Optional conditions to filter when rule applies',
    example: { verticalId: 'real_estate', minAmount: 100 },
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Charge Event DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateChargeEventDto {
  @ApiProperty({ enum: ChargeType })
  @IsEnum(ChargeType)
  @IsNotEmpty()
  chargeType!: ChargeType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'MYR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resourceType!: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  resourceId!: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  pricingConfigId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  pricingRuleId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CalculateChargeDto {
  @ApiProperty({
    description: 'Event type that triggers charge calculation',
    example: 'interaction.created',
  })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({
    description: 'Resource type',
    example: 'interaction',
  })
  @IsString()
  @IsNotEmpty()
  resourceType!: string;

  @ApiProperty({
    description: 'Resource ID',
  })
  @IsUUID()
  @IsNotEmpty()
  resourceId!: string;

  @ApiPropertyOptional({
    description: 'Transaction amount (for commission calculations)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Query DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class ListPricingConfigsDto {
  @ApiPropertyOptional({ enum: PricingModel })
  @IsEnum(PricingModel)
  @IsOptional()
  model?: PricingModel;

  @ApiPropertyOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  verticalId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  pageSize?: number;
}

export class ListPricingRulesDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  pricingConfigId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  pageSize?: number;
}

export class ListChargeEventsDto {
  @ApiPropertyOptional({ enum: ChargeType })
  @IsEnum(ChargeType)
  @IsOptional()
  chargeType?: ChargeType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  eventType?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  processed?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class PricingConfigResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PricingModel })
  model!: PricingModel;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  config!: Record<string, unknown>;

  @ApiPropertyOptional()
  verticalId?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [Object] })
  rules?: unknown[];
}

export class ChargeCalculationResponseDto {
  @ApiProperty()
  shouldCharge!: boolean;

  @ApiPropertyOptional({ enum: ChargeType })
  chargeType?: ChargeType;

  @ApiPropertyOptional()
  amount?: number;

  @ApiPropertyOptional()
  currency?: string;

  @ApiPropertyOptional()
  pricingConfigId?: string;

  @ApiPropertyOptional()
  pricingRuleId?: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;
}
