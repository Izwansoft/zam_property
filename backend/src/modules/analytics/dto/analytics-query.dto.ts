import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AnalyticsDateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Start date (inclusive) in YYYY-MM-DD format',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (inclusive) in YYYY-MM-DD format',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class VendorAnalyticsQueryDto extends AnalyticsDateRangeQueryDto {
  @ApiPropertyOptional({
    description:
      'Vendor UUID. Required for PARTNER_ADMIN; ignored for VENDOR_ADMIN when token has vendorId.',
    example: 'b3b2a6b2-5b0a-4c2b-9b66-3f45d8d2a2b1',
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
