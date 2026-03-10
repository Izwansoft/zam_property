import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Supported payment methods
 */
export enum PaymentMethod {
  CARD = 'CARD',
  FPX = 'FPX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

/**
 * DTO for creating a payment intent (Stripe / FPX)
 */
export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Billing ID to pay against' })
  @IsString()
  @IsNotEmpty()
  billingId!: string;

  @ApiProperty({ description: 'Payment amount in MYR (must be <= balance due)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    default: PaymentMethod.CARD,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod = PaymentMethod.CARD;

  @ApiPropertyOptional({ description: 'Currency code (default: MYR)' })
  @IsString()
  @IsOptional()
  currency?: string = 'MYR';
}

/**
 * DTO for recording a manual/offline payment (bank transfer, cash)
 */
export class RecordManualPaymentDto {
  @ApiProperty({ description: 'Billing ID to pay against' })
  @IsString()
  @IsNotEmpty()
  billingId!: string;

  @ApiProperty({ description: 'Payment amount' })
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

  @ApiPropertyOptional({ description: 'Payment date (defaults to now)' })
  @IsOptional()
  paymentDate?: Date;

  @ApiPropertyOptional({ description: 'Payer name' })
  @IsString()
  @IsOptional()
  payerName?: string;

  @ApiPropertyOptional({ description: 'Payer email' })
  @IsString()
  @IsOptional()
  payerEmail?: string;
}

/**
 * DTO for querying payments
 */
export class PaymentQueryDto {
  @ApiPropertyOptional({ description: 'Filter by billing ID' })
  @IsString()
  @IsOptional()
  billingId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by payment method' })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default: 20)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 20;
}
