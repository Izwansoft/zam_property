import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsObject, IsEnum } from 'class-validator';
import { ContractStatus } from '@prisma/client';

/**
 * DTO for updating contract details.
 */
export class UpdateContractDto {
  @ApiPropertyOptional({
    description: 'Contract start date',
    example: '2026-03-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Contract end date',
    example: '2027-02-28',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Additional contract terms (JSON object)',
    example: { specialConditions: 'No pets allowed', paymentDueDay: 1 },
  })
  @IsObject()
  @IsOptional()
  terms?: Record<string, unknown>;
}

/**
 * DTO for updating contract status.
 */
export class UpdateContractStatusDto {
  @ApiProperty({
    description: 'Contract status',
    enum: ContractStatus,
    example: 'PENDING_SIGNATURE',
  })
  @IsEnum(ContractStatus)
  status!: ContractStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Owner requested changes',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
