import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsArray } from 'class-validator';

/**
 * DTO for approving a payout
 */
export class ApprovePayoutDto {
  @ApiProperty({
    description: 'ID of the user approving the payout',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  approvedBy!: string;
}

/**
 * DTO for batch processing payouts
 */
export class ProcessBatchDto {
  @ApiPropertyOptional({
    description: 'Specific payout IDs to process (omit for all approved payouts)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  payoutIds?: string[];
}

/**
 * DTO for bank file generation
 */
export class BankFileQueryDto {
  @ApiPropertyOptional({
    description: 'Specific payout IDs to include (omit for all approved payouts)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  payoutIds?: string[];
}
