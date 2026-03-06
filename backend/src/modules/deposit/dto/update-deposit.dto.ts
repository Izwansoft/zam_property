import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for marking a deposit as collected
 */
export class CollectDepositDto {
  @ApiPropertyOptional({
    description: 'Payment method used for collection',
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsString()
  collectedVia?: string;

  @ApiPropertyOptional({
    description: 'Payment reference number',
    example: 'PMT-2024-001234',
  })
  @IsOptional()
  @IsString()
  paymentRef?: string;
}

/**
 * Deduction item for refund calculation
 */
export class DeductionItemDto {
  @ApiPropertyOptional({
    description: 'Claim ID for this deduction (optional - for tracking)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  claimId?: string;

  @ApiPropertyOptional({
    description: 'Description of the deduction',
    example: 'Damage to living room wall',
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    description: 'Deduction amount',
    example: 500.00,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}

/**
 * DTO for calculating and processing refund
 */
export class ProcessRefundDto {
  @ApiPropertyOptional({
    description: 'Refund reference number',
    example: 'REF-2024-001234',
  })
  @IsOptional()
  @IsString()
  refundRef?: string;

  @ApiPropertyOptional({
    description: 'Payment method for refund',
    example: 'bank_transfer',
  })
  @IsOptional()
  @IsString()
  refundVia?: string;
}

/**
 * DTO for adding deductions to a deposit
 */
export class AddDeductionDto {
  @ApiPropertyOptional({
    description: 'Claim ID for this deduction',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  claimId?: string;

  @ApiPropertyOptional({
    description: 'Description of the deduction',
    example: 'Wall damage repairs',
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    description: 'Deduction amount',
    example: 500.00,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}

/**
 * DTO for forfeiting a deposit
 */
export class ForfeitDepositDto {
  @ApiPropertyOptional({
    description: 'Reason for forfeiture',
    example: 'Tenant abandoned property without notice',
  })
  @IsString()
  reason!: string;
}
