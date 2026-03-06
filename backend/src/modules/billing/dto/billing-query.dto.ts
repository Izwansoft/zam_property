import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsString,
  IsIn,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RentBillingStatus } from '@prisma/client';

/**
 * DTO for querying bills with filtering, pagination, and sorting
 */
export class BillingQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tenancy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  tenancyId?: string;

  @ApiPropertyOptional({
    description: 'Filter by billing status',
    enum: RentBillingStatus,
    example: 'GENERATED',
  })
  @IsOptional()
  @IsIn(Object.values(RentBillingStatus))
  status?: RentBillingStatus;

  @ApiPropertyOptional({
    description: 'Filter by billing period (month)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  billingPeriod?: string;

  @ApiPropertyOptional({
    description: 'Filter bills from this date (inclusive)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter bills up to this date (inclusive)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

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
    description: 'Filter overdue bills only',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  overdueOnly?: string;

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
  pageSize?: number;

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
  sortOrder?: 'asc' | 'desc';
}
