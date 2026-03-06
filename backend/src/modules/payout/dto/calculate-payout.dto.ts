import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for calculating an owner payout over a period
 */
export class CalculatePayoutDto {
  @ApiProperty({
    description: 'Owner (Vendor) ID to calculate payout for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  ownerId!: string;

  @ApiProperty({
    description: 'Start of payout period (inclusive)',
    example: '2026-03-01',
  })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({
    description: 'End of payout period (inclusive)',
    example: '2026-03-31',
  })
  @IsDateString()
  periodEnd!: string;

  @ApiPropertyOptional({
    description: 'Platform fee percentage to apply (default: 10)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent?: number;
}
