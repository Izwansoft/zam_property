import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { VendorType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @ApiPropertyOptional({
    description: 'Vendor display name',
    example: 'ABC Property Agency Updated',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Vendor description',
    example: 'Updated description',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Vendor type',
    enum: VendorType,
  })
  @IsEnum(VendorType)
  @IsOptional()
  vendorType?: VendorType;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'updated@abcproperty.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+60123456788',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Vendor website URL',
    example: 'https://www.abcproperty-updated.com',
  })
  @IsUrl()
  @IsOptional()
  website?: string;
}
