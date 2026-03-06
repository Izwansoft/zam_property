import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsDateString,
  Min,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Line item types supported by the billing system
 */
export const LINE_ITEM_TYPES = ['RENT', 'UTILITY', 'LATE_FEE', 'CLAIM_DEDUCTION', 'OTHER'] as const;
export type LineItemType = (typeof LINE_ITEM_TYPES)[number];

/**
 * DTO for generating a bill for a tenancy period
 */
export class GenerateBillDto {
  @ApiProperty({
    description: 'Tenancy ID to generate bill for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenancyId!: string;

  @ApiProperty({
    description: 'Billing period (first day of month being billed)',
    example: '2026-03-01',
  })
  @IsDateString()
  billingPeriod!: string;

  @ApiPropertyOptional({
    description: 'Override the issue date (defaults to today)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Include late fee calculation if previous bills are overdue',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeLateFee?: boolean;

  @ApiPropertyOptional({
    description: 'Additional line items to include in the bill',
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalLineItemDto)
  additionalLineItems?: AdditionalLineItemDto[];
}

/**
 * DTO for adding an additional line item during bill generation
 */
export class AdditionalLineItemDto {
  @ApiProperty({
    description: 'Description of the line item',
    example: 'Water utility charge',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Type of line item',
    enum: LINE_ITEM_TYPES,
    example: 'UTILITY',
  })
  @IsString()
  @IsIn(LINE_ITEM_TYPES)
  type!: LineItemType;

  @ApiProperty({
    description: 'Amount (positive for charges, negative for credits)',
    example: 150.0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @ApiPropertyOptional({
    description: 'Reference claim ID if applicable',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  claimId?: string;
}

/**
 * DTO for adding a line item to an existing bill
 */
export class AddLineItemDto {
  @ApiProperty({
    description: 'Description of the line item',
    example: 'Additional cleaning charge',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Type of line item',
    enum: LINE_ITEM_TYPES,
    example: 'OTHER',
  })
  @IsString()
  @IsIn(LINE_ITEM_TYPES)
  type!: LineItemType;

  @ApiProperty({
    description: 'Amount (positive for charges, negative for credits)',
    example: 200.0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @ApiPropertyOptional({
    description: 'Reference claim ID if applicable',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  claimId?: string;
}

/**
 * DTO for applying late fee to a bill
 */
export class ApplyLateFeeDto {
  @ApiPropertyOptional({
    description: 'Override the late fee percentage (uses tenancy default if not provided)',
    example: 10.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  lateFeePercent?: number;
}
