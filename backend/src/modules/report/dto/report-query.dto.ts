/**
 * Financial Report DTOs
 * Session 6.8 - Phase 6 Testing & Reports
 */

import { IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export class RevenueReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date for report period (ISO)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for report period (ISO)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ReportPeriod, description: 'Grouping period', default: ReportPeriod.MONTHLY })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ description: 'Filter by owner (vendor) ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class CollectionReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date for report period (ISO)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for report period (ISO)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ReportPeriod, description: 'Grouping period', default: ReportPeriod.MONTHLY })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ description: 'Filter by tenancy ID' })
  @IsOptional()
  @IsUUID()
  tenancyId?: string;
}

export class OutstandingReportQueryDto {
  @ApiPropertyOptional({ description: 'Cut-off date for overdue calculation (ISO)', example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({ description: 'Filter by owner (vendor) ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by tenancy ID' })
  @IsOptional()
  @IsUUID()
  tenancyId?: string;
}
