import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LegalCaseStatus } from '@prisma/client';

export class LegalCaseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: LegalCaseStatus })
  @IsOptional()
  @IsEnum(LegalCaseStatus)
  status?: LegalCaseStatus;

  @ApiPropertyOptional({ description: 'Filter by reason (NON_PAYMENT, BREACH, DAMAGE, OTHER)' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Filter by tenancy ID' })
  @IsOptional()
  @IsString()
  tenancyId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'createdAt',
    enum: ['createdAt', 'amountOwed', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortDir?: 'asc' | 'desc' = 'desc';
}
