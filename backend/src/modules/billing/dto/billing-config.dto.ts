import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating billing configuration for a tenancy.
 *
 * - billingDay: Day of month to generate bill (1-28)
 * - paymentDueDay: Number of days after billing date for payment deadline (1-60)
 * - lateFeePercent: Percentage late fee on overdue balance (0-100, null to disable)
 */
export class UpdateBillingConfigDto {
  @ApiPropertyOptional({
    description: 'Day of month to generate bills (1-28). Avoids 29-31 for consistency across months.',
    example: 1,
    minimum: 1,
    maximum: 28,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  billingDay?: number;

  @ApiPropertyOptional({
    description: 'Number of days after billing date for payment due date (1-60)',
    example: 7,
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  paymentDueDay?: number;

  @ApiPropertyOptional({
    description: 'Late fee percentage applied to overdue balance (0-100). Set to null to disable late fees.',
    example: 10.0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  lateFeePercent?: number | null;
}
