import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsDateString,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new tenancy (booking)
 * Validates that the listing is PARTNER_MANAGED before allowing tenancy creation
 */
export class CreateTenancyDto {
  @ApiProperty({
    description: 'Listing ID to create tenancy for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  listingId!: string;

  @ApiProperty({
    description: 'Tenant ID for the partner',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiPropertyOptional({
    description: 'Proposed move-in date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @ApiPropertyOptional({
    description: 'Proposed lease start date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  leaseStartDate?: string;

  @ApiPropertyOptional({
    description: 'Proposed lease end date',
    example: '2027-02-28',
  })
  @IsOptional()
  @IsDateString()
  leaseEndDate?: string;

  @ApiProperty({
    description: 'Monthly rent amount',
    example: 2500.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  monthlyRent!: number;

  @ApiProperty({
    description: 'Security deposit amount',
    example: 5000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  securityDeposit!: number;

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
    default: 1,
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
    default: 7,
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
    example: 'Partner prefers early move-in',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
