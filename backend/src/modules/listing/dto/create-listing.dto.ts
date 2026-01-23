import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsNumber,
  IsPositive,
  IsObject,
  ValidateNested,
  IsIn,
} from 'class-validator';

export class LocationDto {
  @ApiPropertyOptional({ description: 'Street address', example: '123 Jalan Sultan' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Kuala Lumpur' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province', example: 'Wilayah Persekutuan' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'MY' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '50000' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Latitude', example: 3.139 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 101.6869 })
  @IsNumber()
  @IsOptional()
  lng?: number;
}

export class CreateListingDto {
  @ApiProperty({
    description: 'Vendor ID that owns this listing',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  vendorId!: string;

  @ApiProperty({
    description: 'Vertical type (e.g., real_estate, automotive)',
    example: 'real_estate',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  verticalType!: string;

  @ApiProperty({
    description: 'Listing title',
    example: 'Beautiful 3-Bedroom Condo in KLCC',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Listing description',
    example: 'Spacious and well-maintained condo with stunning city views...',
    maxLength: 10000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Listing price',
    example: 500000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'MYR',
    default: 'MYR',
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
      bedrooms: 3,
      bathrooms: 2,
      builtUpSize: 1200,
      furnishing: 'fully_furnished',
    },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, unknown>;
}
