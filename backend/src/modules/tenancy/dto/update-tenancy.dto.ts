import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsPositive, IsDateString, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating an existing tenancy
 * Status changes should go through workflow endpoints, not direct update
 */
export class UpdateTenancyDto {
  @ApiPropertyOptional({
    description: 'Move-in date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @ApiPropertyOptional({
    description: 'Move-out date',
    example: '2027-03-01',
  })
  @IsOptional()
  @IsDateString()
  moveOutDate?: string;

  @ApiPropertyOptional({
    description: 'Lease start date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  leaseStartDate?: string;

  @ApiPropertyOptional({
    description: 'Lease end date',
    example: '2027-02-28',
  })
  @IsOptional()
  @IsDateString()
  leaseEndDate?: string;

  @ApiPropertyOptional({
    description: 'Monthly rent amount (only editable before ACTIVE)',
    example: 2500.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  monthlyRent?: number;

  @ApiPropertyOptional({
    description: 'Security deposit amount (only editable before ACTIVE)',
    example: 5000.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  securityDeposit?: number;

  @ApiPropertyOptional({
    description: 'Utility deposit amount',
    example: 500.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  utilityDeposit?: number;

  @ApiPropertyOptional({
    description: 'Key deposit amount',
    example: 100.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  keyDeposit?: number;

  @ApiPropertyOptional({
    description: 'Day of month for billing (1-31)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  billingDay?: number;

  @ApiPropertyOptional({
    description: 'Days after billing date for payment due (1-30)',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  paymentDueDay?: number;

  @ApiPropertyOptional({
    description: 'Late fee percentage',
    example: 5.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  lateFeePercent?: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Updated rental terms',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
