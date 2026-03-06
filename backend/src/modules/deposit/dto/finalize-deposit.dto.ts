import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for finalizing deposit refund
 *
 * Finalizing a deposit:
 * 1. Fetches all APPROVED/PARTIALLY_APPROVED claims for the tenancy
 * 2. Links claims as deductions to the deposit
 * 3. Calculates net refundable amount
 * 4. Marks claims as SETTLED with DEPOSIT_DEDUCTION
 * 5. Processes the refund (full or partial)
 */
export class FinalizeDepositDto {
  @ApiPropertyOptional({
    description: 'Refund reference number',
    example: 'REF-2026-001234',
  })
  @IsOptional()
  @IsString()
  refundRef?: string;

  @ApiPropertyOptional({
    description: 'Notes about the finalization',
    example: 'Final inspection completed. Deducting wall repair from security deposit.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
