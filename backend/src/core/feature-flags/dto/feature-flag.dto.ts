import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureFlagType, Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class FeatureFlagResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'new-search-ranking' })
  key!: string;

  @ApiProperty({ enum: FeatureFlagType, example: FeatureFlagType.BOOLEAN })
  type!: FeatureFlagType;

  @ApiProperty({ example: 'Enable the new search ranking algorithm' })
  description!: string;

  @ApiProperty({ example: 'platform-team' })
  owner!: string;

  @ApiProperty({ example: false })
  defaultValue!: boolean;

  @ApiPropertyOptional({ example: 25, description: '0-100 percentage rollout' })
  rolloutPercentage?: number | null;

  @ApiPropertyOptional({ type: [String], example: ['real_estate'] })
  allowedVerticals?: string[];

  @ApiPropertyOptional({ isArray: true, enum: Role, example: [Role.PARTNER_ADMIN] })
  allowedRoles?: Role[];

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00Z' })
  reviewAt?: string | null;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  expiresAt?: string | null;

  @ApiProperty({ example: false })
  isArchived!: boolean;

  @ApiProperty({ example: '2026-01-21T12:00:00Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-21T12:00:00Z' })
  updatedAt!: string;
}

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'new-search-ranking' })
  @IsString()
  key!: string;

  @ApiProperty({ enum: FeatureFlagType, example: FeatureFlagType.BOOLEAN })
  @IsEnum(FeatureFlagType)
  type!: FeatureFlagType;

  @ApiProperty({ example: 'Enable the new search ranking algorithm' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'platform-team' })
  @IsString()
  owner!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  defaultValue?: boolean;

  @ApiPropertyOptional({ example: 25, description: '0-100 percentage rollout' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({ type: [String], example: ['real_estate'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedVerticals?: string[];

  @ApiPropertyOptional({ isArray: true, enum: Role, example: [Role.PARTNER_ADMIN] })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  allowedRoles?: Role[];

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  reviewAt?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ enum: FeatureFlagType })
  @IsOptional()
  @IsEnum(FeatureFlagType)
  type?: FeatureFlagType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  defaultValue?: boolean;

  @ApiPropertyOptional({ example: 25, description: '0-100 percentage rollout. Use null to clear.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedVerticals?: string[];

  @ApiPropertyOptional({ isArray: true, enum: Role })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  allowedRoles?: Role[];

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  reviewAt?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class UpsertFeatureFlagOverrideDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Partner UUID. Omit for global override.' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ example: 'real_estate' })
  @IsOptional()
  @IsString()
  verticalType?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: false, description: 'Emergency overrides take top precedence.' })
  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  value!: boolean;

  @ApiPropertyOptional({
    example: 10,
    description: 'Optional percentage rollout for this override.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;
}

export class SetFeatureFlagUserTargetDto {
  @ApiProperty({ example: 'uuid', description: 'Partner UUID' })
  @IsUUID()
  partnerId!: string;

  @ApiProperty({ example: 'uuid', description: 'User UUID' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  value!: boolean;
}
