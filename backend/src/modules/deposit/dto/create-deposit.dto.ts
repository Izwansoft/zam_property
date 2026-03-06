import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  IsPositive,
  IsIn,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Deposit types supported by the system
 */
export const DEPOSIT_TYPES = ['SECURITY', 'UTILITY', 'KEY'] as const;
export type DepositType = (typeof DEPOSIT_TYPES)[number];

/**
 * DTO for creating a deposit
 */
export class CreateDepositDto {
  @ApiProperty({
    description: 'Tenancy ID this deposit belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenancyId!: string;

  @ApiProperty({
    description: 'Type of deposit',
    enum: DEPOSIT_TYPES,
    example: 'SECURITY',
  })
  @IsString()
  @IsIn(DEPOSIT_TYPES)
  type!: DepositType;

  @ApiProperty({
    description: 'Deposit amount',
    example: 3000.00,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}

/**
 * DTO for creating multiple deposits for a tenancy at once
 */
export class CreateDepositsFromTenancyDto {
  @ApiProperty({
    description: 'Tenancy ID to create deposits for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenancyId!: string;

  @ApiPropertyOptional({
    description: 'Override security deposit amount (uses tenancy.securityDeposit if not provided)',
    example: 3000.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  securityDeposit?: number;

  @ApiPropertyOptional({
    description: 'Override utility deposit amount (uses tenancy.utilityDeposit if not provided)',
    example: 500.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  utilityDeposit?: number;

  @ApiPropertyOptional({
    description: 'Override key deposit amount (uses tenancy.keyDeposit if not provided)',
    example: 100.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  keyDeposit?: number;
}
