/**
 * CommissionQueryDto
 * Session 8.3 - Agent Commission
 *
 * DTO for querying/filtering commissions.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionStatus, CommissionType } from '@prisma/client';

export class CommissionQueryDto {
  @ApiPropertyOptional({ description: 'Filter by agent ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Filter by tenancy ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenancyId?: string;

  @ApiPropertyOptional({ description: 'Filter by commission type', enum: CommissionType })
  @IsOptional()
  @IsEnum(CommissionType)
  type?: CommissionType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CommissionStatus })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'amount', 'dealValue', 'status'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';
}
