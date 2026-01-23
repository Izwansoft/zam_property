import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class PublishListingDto {
  @ApiPropertyOptional({
    description:
      'Optional expiry date (ISO 8601). If not provided, defaults based on tenant settings.',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class ArchiveListingDto {
  @ApiPropertyOptional({
    description: 'Reason for archiving',
    example: 'Property sold',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

export class ExpireListingDto {
  @ApiPropertyOptional({
    description: 'Reason for expiring',
    example: 'Listing period ended',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

export class UnpublishListingDto {
  @ApiProperty({
    description: 'Reason for unpublishing (returns to draft)',
    example: 'Need to update information',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class FeatureListingDto {
  @ApiProperty({
    description: 'Featured until date (ISO 8601)',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  featuredUntil!: string;
}

export class UnfeatureListingDto {
  @ApiPropertyOptional({
    description: 'Reason for removing featured status',
    example: 'Featured period ended',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
