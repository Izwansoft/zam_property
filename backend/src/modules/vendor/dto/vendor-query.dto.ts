import { ApiPropertyOptional } from '@nestjs/swagger';
import { VendorStatus, VendorType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class VendorQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Filter by vendor status',
    enum: VendorStatus,
    example: VendorStatus.APPROVED,
  })
  @IsEnum(VendorStatus)
  @IsOptional()
  status?: VendorStatus;

  @ApiPropertyOptional({
    description: 'Filter by vendor type',
    enum: VendorType,
    example: VendorType.COMPANY,
  })
  @IsEnum(VendorType)
  @IsOptional()
  vendorType?: VendorType;

  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'ABC',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by vertical type (e.g. PROPERTY, AUTOMOTIVE)',
    example: 'PROPERTY',
  })
  @IsString()
  @IsOptional()
  verticalType?: string;
}
