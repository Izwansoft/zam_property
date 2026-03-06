/**
 * CalculateCommissionDto
 * Session 8.3 - Agent Commission
 *
 * DTO for calculating/creating a commission from a tenancy.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional, IsNumber, Min, Max, IsString, MaxLength } from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CalculateCommissionDto {
  @ApiProperty({ description: 'Agent ID', format: 'uuid' })
  @IsUUID()
  agentId!: string;

  @ApiProperty({ description: 'Tenancy ID', format: 'uuid' })
  @IsUUID()
  tenancyId!: string;

  @ApiProperty({ description: 'Commission type', enum: CommissionType })
  @IsEnum(CommissionType)
  type!: CommissionType;

  @ApiPropertyOptional({ description: 'Override commission rate (default uses company/agent config). Value represents months of rent, e.g. 1.00 = 1 month', minimum: 0, maximum: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(12)
  rate?: number;

  @ApiPropertyOptional({ description: 'Notes about this commission', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
