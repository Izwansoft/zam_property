/**
 * Audit DTOs
 * Session 4.4 - Audit Logging
 *
 * Request/Response DTOs for audit endpoints.
 */

import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AuditActorType } from '@prisma/client';

export class AuditLogQueryDto {
  @ApiPropertyOptional({ description: 'Filter by actor ID' })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by actor type',
    enum: AuditActorType,
  })
  @IsOptional()
  @IsEnum(AuditActorType)
  actorType?: AuditActorType;

  @ApiPropertyOptional({
    description: 'Filter by action type (e.g., user.created, listing.published)',
  })
  @IsOptional()
  @IsString()
  actionType?: string;

  @ApiPropertyOptional({
    description: 'Filter by target type (e.g., user, listing, vendor)',
  })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional({ description: 'Filter by target ID' })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Filter by request ID' })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Audit log ID' })
  id!: string;

  @ApiPropertyOptional({ description: 'Partner ID' })
  partnerId?: string;

  @ApiProperty({ description: 'Actor type', enum: AuditActorType })
  actorType!: AuditActorType;

  @ApiPropertyOptional({ description: 'Actor ID (user ID)' })
  actorId?: string;

  @ApiPropertyOptional({ description: 'Actor email (masked)' })
  actorEmail?: string;

  @ApiProperty({ description: 'Action type (e.g., user.created)' })
  actionType!: string;

  @ApiProperty({ description: 'Target type (e.g., user, listing)' })
  targetType!: string;

  @ApiPropertyOptional({ description: 'Target ID' })
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Previous values (changed fields only, masked)',
  })
  oldValue?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'New values (changed fields only, masked)',
  })
  newValue?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'IP address (masked)' })
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Request ID for correlation' })
  requestId?: string;

  @ApiProperty({ description: 'Timestamp when the action occurred' })
  timestamp!: Date;
}

export class AuditLogListResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  data!: AuditLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, pageSize: 20, totalItems: 100, totalPages: 5 },
  })
  meta!: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export class AuditActionTypesResponseDto {
  @ApiProperty({
    description: 'List of distinct action types',
    example: ['user.created', 'listing.published', 'vendor.approved'],
  })
  actionTypes!: string[];
}

export class AuditTargetTypesResponseDto {
  @ApiProperty({
    description: 'List of distinct target types',
    example: ['user', 'listing', 'vendor', 'subscription'],
  })
  targetTypes!: string[];
}
