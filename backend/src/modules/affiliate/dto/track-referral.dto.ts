/**
 * TrackReferralDto
 * Session 8.4 - Affiliate Module
 *
 * DTO for tracking a new referral against an affiliate.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  MaxLength,
} from 'class-validator';
import { ReferralType } from '@prisma/client';

export class TrackReferralDto {
  @ApiProperty({ description: 'Affiliate ID', format: 'uuid' })
  @IsUUID()
  affiliateId!: string;

  @ApiProperty({ description: 'Type of referral', enum: ReferralType })
  @IsEnum(ReferralType)
  referralType!: ReferralType;

  @ApiProperty({ description: 'ID of the referred entity (vendor, tenancy, or agent)', format: 'uuid' })
  @IsUUID()
  referredId!: string;

  @ApiPropertyOptional({ description: 'Override commission rate (percentage, e.g. 5.00 = 5%)', minimum: 0, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Override commission amount (fixed amount instead of rate)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionAmount?: number;

  @ApiPropertyOptional({ description: 'Notes about this referral', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
