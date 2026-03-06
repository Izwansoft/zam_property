/**
 * UpdateAffiliateDto
 * Session 8.4 - Affiliate Module
 *
 * DTO for updating an affiliate's bank details or type.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AffiliateType } from '@prisma/client';

export class UpdateAffiliateDto {
  @ApiPropertyOptional({ description: 'Affiliate type', enum: AffiliateType })
  @IsOptional()
  @IsEnum(AffiliateType)
  type?: AffiliateType;

  @ApiPropertyOptional({ description: 'Bank name for payouts' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccount?: string;

  @ApiPropertyOptional({ description: 'Bank account holder name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankAccountName?: string;

  @ApiPropertyOptional({ description: 'Notes about this affiliate', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
