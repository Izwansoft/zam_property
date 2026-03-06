import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DepositStatus } from '@prisma/client';

import { DEPOSIT_TYPES, DepositType } from './create-deposit.dto';

/**
 * DTO for querying deposits
 */
export class DepositQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tenancy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  tenancyId?: string;

  @ApiPropertyOptional({
    description: 'Filter by deposit type',
    enum: DEPOSIT_TYPES,
    example: 'SECURITY',
  })
  @IsOptional()
  @IsString()
  @IsIn(DEPOSIT_TYPES)
  type?: DepositType;

  @ApiPropertyOptional({
    description: 'Filter by deposit status',
    enum: DepositStatus,
    example: 'COLLECTED',
  })
  @IsOptional()
  @IsIn(Object.values(DepositStatus))
  status?: DepositStatus;

  @ApiPropertyOptional({
    description: 'Filter by owner ID (through tenancy)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID (through tenancy)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}
