/**
 * AffiliateQueryDto / ReferralQueryDto
 * Session 8.4 - Affiliate Module
 *
 * DTOs for querying affiliates and referrals with pagination & filters.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AffiliateStatus, ReferralType, ReferralStatus } from '@prisma/client';

export class AffiliateQueryDto {
  @ApiPropertyOptional({ description: 'Filter by affiliate status', enum: AffiliateStatus })
  @IsOptional()
  @IsEnum(AffiliateStatus)
  status?: AffiliateStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'totalEarnings', 'totalReferrals'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortDir?: 'asc' | 'desc' = 'desc';
}

export class ReferralQueryDto {
  @ApiPropertyOptional({ description: 'Filter by referral type', enum: ReferralType })
  @IsOptional()
  @IsEnum(ReferralType)
  referralType?: ReferralType;

  @ApiPropertyOptional({ description: 'Filter by referral status', enum: ReferralStatus })
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'commissionAmount'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortDir?: 'asc' | 'desc' = 'desc';
}
