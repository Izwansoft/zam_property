import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsDateString, IsObject } from 'class-validator';

/**
 * DTO for creating a contract from a tenancy.
 */
export class CreateContractDto {
  @ApiProperty({
    description: 'The tenancy ID to create contract for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenancyId!: string;

  @ApiPropertyOptional({
    description: 'Template ID to use for contract generation',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiProperty({
    description: 'Contract start date',
    example: '2026-03-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'Contract end date',
    example: '2027-02-28',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Additional contract terms (JSON object)',
    example: { specialConditions: 'No pets allowed', paymentDueDay: 1 },
  })
  @IsObject()
  @IsOptional()
  terms?: Record<string, unknown>;
}

/**
 * DTO for generating contract PDF.
 */
export class GenerateContractPdfDto {
  @ApiPropertyOptional({
    description: 'Force regeneration even if PDF exists',
    example: false,
  })
  @IsOptional()
  forceRegenerate?: boolean;
}
