import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ClaimType, ClaimStatus } from '@prisma/client';

export class ClaimQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tenancy ID' })
  @IsString()
  @IsOptional()
  tenancyId?: string;

  @ApiPropertyOptional({ enum: ['DAMAGE', 'CLEANING', 'MISSING_ITEM', 'UTILITY', 'OTHER'] })
  @IsEnum(ClaimType)
  @IsOptional()
  type?: ClaimType;

  @ApiPropertyOptional({ enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'SETTLED', 'DISPUTED'] })
  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;

  @ApiPropertyOptional({ description: 'Search by claim number, title, or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
