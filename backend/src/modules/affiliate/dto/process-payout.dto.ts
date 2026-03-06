/**
 * ProcessPayoutDto
 * Session 8.4 - Affiliate Module
 *
 * DTO for processing an affiliate payout.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ProcessPayoutDto {
  @ApiPropertyOptional({ description: 'Payment reference / bank transfer ref', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Notes about this payout', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
