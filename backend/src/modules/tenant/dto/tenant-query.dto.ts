import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TenantStatus } from '@prisma/client';

export class TenantQueryDto {
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
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by status', enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({ description: 'Search by name, email, IC number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by IC verified status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  icVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by income verified status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  incomeVerified?: boolean;
}
