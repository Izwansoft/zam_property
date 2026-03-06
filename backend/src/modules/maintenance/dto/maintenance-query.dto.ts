import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying maintenance tickets
 */
export class MaintenanceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: [
      'OPEN',
      'VERIFIED',
      'ASSIGNED',
      'IN_PROGRESS',
      'PENDING_APPROVAL',
      'CLAIM_SUBMITTED',
      'CLAIM_APPROVED',
      'CLAIM_REJECTED',
      'CLOSED',
      'CANCELLED',
    ],
    example: 'OPEN',
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'OPEN',
    'VERIFIED',
    'ASSIGNED',
    'IN_PROGRESS',
    'PENDING_APPROVAL',
    'CLAIM_SUBMITTED',
    'CLAIM_APPROVED',
    'CLAIM_REJECTED',
    'CLOSED',
    'CANCELLED',
  ])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    example: 'HIGH',
  })
  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: ['PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'STRUCTURAL', 'OTHER'],
    example: 'PLUMBING',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'STRUCTURAL', 'OTHER'])
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenancy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  tenancyId?: string;

  @ApiPropertyOptional({
    description: 'Search by ticket number or title',
    example: 'MNT-',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
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
    enum: ['createdAt', 'updatedAt', 'priority', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'priority', 'status'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
