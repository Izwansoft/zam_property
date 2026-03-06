/**
 * MarkPaidDto
 * Session 8.3 - Agent Commission
 *
 * DTO for marking a commission as paid.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPaidDto {
  @ApiPropertyOptional({ description: 'Payment reference / receipt number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paidRef?: string;

  @ApiPropertyOptional({ description: 'Payment notes', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
