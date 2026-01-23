import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({
    description: 'Vendor display name',
    example: 'ABC Property Agency',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Vendor description',
    example: 'Premier property agency serving Kuala Lumpur since 2010',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Vendor type',
    enum: VendorType,
    example: VendorType.COMPANY,
  })
  @IsEnum(VendorType)
  @IsOptional()
  vendorType?: VendorType;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'contact@abcproperty.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+60123456789',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Vendor website URL',
    example: 'https://www.abcproperty.com',
  })
  @IsUrl()
  @IsOptional()
  website?: string;
}
