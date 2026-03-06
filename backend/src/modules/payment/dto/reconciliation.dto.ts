import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaymentMethod } from './create-payment.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Statement of Account Query
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for querying statement of account
 */
export class StatementQueryDto {
  @ApiPropertyOptional({ description: 'Start date for statement period (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date for statement period (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reassign Payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for reassigning a payment from one billing to another
 */
export class ReassignPaymentDto {
  @ApiProperty({ description: 'Payment ID to reassign' })
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @ApiProperty({ description: 'New billing ID to assign payment to' })
  @IsString()
  @IsNotEmpty()
  newBillingId!: string;

  @ApiPropertyOptional({ description: 'Reason for reassignment' })
  @IsString()
  @IsOptional()
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Advance Payment (distribute across multiple outstanding billings)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for making an advance/batch payment across outstanding billings
 */
export class AdvancePaymentDto {
  @ApiProperty({ description: 'Tenancy ID to apply advance payment for' })
  @IsString()
  @IsNotEmpty()
  tenancyId!: string;

  @ApiProperty({ description: 'Total payment amount to distribute' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({
    description: 'Payment method',
    enum: [PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH, PaymentMethod.OTHER],
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Bank reference or transaction ID' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Payer name' })
  @IsString()
  @IsOptional()
  payerName?: string;

  @ApiPropertyOptional({ description: 'Payer email' })
  @IsString()
  @IsOptional()
  payerEmail?: string;
}
