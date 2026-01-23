import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  IsPositive,
  IsObject,
  ValidateNested,
  IsIn,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { LocationDto } from './create-listing.dto';

export class UpdateListingDto {
  @ApiPropertyOptional({
    description: 'Listing title',
    example: 'Updated: Beautiful 3-Bedroom Condo in KLCC',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Listing description',
    example: 'Updated description with more details...',
    maxLength: 10000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Listing price',
    example: 550000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'MYR',
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Price type',
    example: 'sale',
    enum: ['sale', 'rent', 'negotiable'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['sale', 'rent', 'negotiable'])
  priceType?: string;

  @ApiPropertyOptional({
    description: 'Location details',
    type: LocationDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Vertical-specific attributes (JSON object)',
    example: {
      propertyType: 'condominium',
      bedrooms: 4,
      bathrooms: 3,
    },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Whether listing is featured',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Featured until date (ISO 8601)',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  featuredUntil?: string;

  @ApiPropertyOptional({
    description: 'Listing expiry date (ISO 8601)',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
