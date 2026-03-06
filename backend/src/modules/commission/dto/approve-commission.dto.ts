/**
 * ApproveCommissionDto
 * Session 8.3 - Agent Commission
 *
 * DTO for approving a commission.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveCommissionDto {
  @ApiPropertyOptional({ description: 'Approval notes', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
