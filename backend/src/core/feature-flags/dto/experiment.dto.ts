import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExperimentVariantDto {
  @ApiProperty({ example: 'control' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 50, description: 'Weight for deterministic assignment' })
  @IsInt()
  @Min(0)
  @Max(10000)
  weight!: number;
}

export class ExperimentResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'search-ranking-v2' })
  key!: string;

  @ApiProperty({ example: 'A/B test for search ranking v2' })
  description!: string;

  @ApiProperty({ example: 'growth-team' })
  owner!: string;

  @ApiPropertyOptional({ example: 'CTR, conversion rate' })
  successMetrics?: string | null;

  @ApiProperty({ type: [ExperimentVariantDto] })
  variants!: ExperimentVariantDto[];

  @ApiProperty({ example: '2026-01-21T00:00:00Z' })
  startsAt!: string;

  @ApiProperty({ example: '2026-02-21T00:00:00Z' })
  endsAt!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class CreateExperimentDto {
  @ApiProperty({ example: 'search-ranking-v2' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'A/B test for search ranking v2' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'growth-team' })
  @IsString()
  owner!: string;

  @ApiPropertyOptional({ example: 'CTR, conversion rate' })
  @IsOptional()
  @IsString()
  successMetrics?: string;

  @ApiProperty({ type: [ExperimentVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants!: ExperimentVariantDto[];

  @ApiProperty({ example: '2026-01-21T00:00:00Z' })
  @IsString()
  startsAt!: string;

  @ApiProperty({ example: '2026-02-21T00:00:00Z' })
  @IsString()
  endsAt!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'new-search-ranking',
    description: 'Optional feature flag key to associate with this experiment',
  })
  @IsOptional()
  @IsString()
  featureFlagKey?: string;
}

export class SetExperimentPartnerOptInDto {
  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Partner UUID. Defaults to current partner context.',
  })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  optIn!: boolean;
}
