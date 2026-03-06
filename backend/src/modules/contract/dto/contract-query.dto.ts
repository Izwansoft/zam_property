import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContractStatus } from '@prisma/client';

/**
 * DTO for querying contracts with filters and pagination.
 */
export class ContractQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tenancy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  tenancyId?: string;

  @ApiPropertyOptional({
    description: 'Filter by contract status',
    enum: ContractStatus,
    example: 'ACTIVE',
  })
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @ApiPropertyOptional({
    description: 'Search by contract number',
    example: 'CON-2026-001',
  })
  @IsString()
  @IsOptional()
  contractNumber?: string;

  @ApiPropertyOptional({
    description: 'Page number (starts at 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  sortDir?: 'asc' | 'desc' = 'desc';
}
