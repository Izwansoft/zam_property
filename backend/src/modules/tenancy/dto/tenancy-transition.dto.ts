import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for status transition with optional reason
 */
export class TransitionTenancyDto {
  @ApiPropertyOptional({
    description: 'Reason for the status change',
    example: 'Deposit confirmed via bank transfer',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for confirming booking (DRAFT → BOOKED)
 */
export class ConfirmBookingDto extends TransitionTenancyDto {
  @ApiPropertyOptional({
    description: 'Confirmed move-in date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @ApiPropertyOptional({
    description: 'Confirmed lease start date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  leaseStartDate?: string;

  @ApiPropertyOptional({
    description: 'Confirmed lease end date',
    example: '2027-02-28',
  })
  @IsOptional()
  @IsDateString()
  leaseEndDate?: string;
}

/**
 * DTO for confirming deposit payment (BOOKED → DEPOSIT_PAID)
 */
export class ConfirmDepositDto extends TransitionTenancyDto {
  @ApiPropertyOptional({
    description: 'Payment reference number',
    example: 'TXN-123456789',
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

/**
 * DTO for requesting termination
 */
export class RequestTerminationDto extends TransitionTenancyDto {
  @ApiProperty({
    description: 'Requested move-out date',
    example: '2026-12-31',
  })
  @IsDateString()
  requestedMoveOutDate!: string;

  @ApiPropertyOptional({
    description: 'Reason for termination',
    example: 'Relocating for work',
  })
  @IsOptional()
  @IsString()
  terminationReason?: string;
}

/**
 * DTO for completing termination
 */
export class TerminateTenancyDto extends TransitionTenancyDto {
  @ApiPropertyOptional({
    description: 'Actual move-out date',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  actualMoveOutDate?: string;

  @ApiPropertyOptional({
    description: 'Final inspection notes',
    example: 'Property returned in good condition',
  })
  @IsOptional()
  @IsString()
  inspectionNotes?: string;
}

/**
 * DTO for extending tenancy (renewal)
 */
export class ExtendTenancyDto extends TransitionTenancyDto {
  @ApiProperty({
    description: 'New lease end date',
    example: '2028-02-28',
  })
  @IsDateString()
  newLeaseEndDate!: string;

  @ApiPropertyOptional({
    description: 'New monthly rent (if changed)',
    example: 2700.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  newMonthlyRent?: number;

  @ApiPropertyOptional({
    description: 'Extension notes',
    example: 'Rent increased by 8% as per market rate',
  })
  @IsOptional()
  @IsString()
  extensionNotes?: string;
}
