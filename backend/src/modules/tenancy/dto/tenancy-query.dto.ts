import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TenancyStatus } from '@prisma/client';

/**
 * DTO for querying tenancies with filtering and pagination
 */
export class TenancyQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
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
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['createdAt', 'updatedAt', 'leaseStartDate', 'leaseEndDate', 'monthlyRent'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'leaseStartDate', 'leaseEndDate', 'monthlyRent'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by listing ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Filter by owner (vendor) ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenancy status',
    enum: TenancyStatus,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(TenancyStatus)
  status?: TenancyStatus;

  @ApiPropertyOptional({
    description: 'Filter by multiple statuses (comma-separated)',
    example: 'ACTIVE,BOOKED,DEPOSIT_PAID',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s: string) => s.trim());
    }
    return value;
  })
  statuses?: TenancyStatus[];

  @ApiPropertyOptional({
    description: 'Search by listing title or tenant name',
    example: 'Condo',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter tenancies with lease ending before this date',
    example: '2026-06-01',
  })
  @IsOptional()
  @IsString()
  leaseEndBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter tenancies with lease ending after this date',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsString()
  leaseEndAfter?: string;
}
