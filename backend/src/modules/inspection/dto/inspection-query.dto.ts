import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { INSPECTION_TYPES } from './create-inspection.dto';

export const INSPECTION_STATUSES = [
  'SCHEDULED',
  'VIDEO_REQUESTED',
  'VIDEO_SUBMITTED',
  'ONSITE_PENDING',
  'COMPLETED',
  'REPORT_GENERATED',
] as const;

export type InspectionStatusValue = (typeof INSPECTION_STATUSES)[number];

export class InspectionQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tenancy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  tenancyId?: string;

  @ApiPropertyOptional({
    description: 'Filter by inspection type',
    enum: INSPECTION_TYPES,
    example: 'PERIODIC',
  })
  @IsOptional()
  @IsIn(INSPECTION_TYPES)
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: INSPECTION_STATUSES,
    example: 'SCHEDULED',
  })
  @IsOptional()
  @IsIn(INSPECTION_STATUSES)
  status?: string;

  @ApiPropertyOptional({ description: 'Search keyword', example: 'move in' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
