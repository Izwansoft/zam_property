import { IsString, IsEnum, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType } from '@prisma/client';

export class RegisterCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'ABC Property Sdn Bhd' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Company registration number (SSM)', example: '202401012345' })
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  registrationNo!: string;

  @ApiProperty({ enum: CompanyType, description: 'Company type', example: 'AGENCY' })
  @IsEnum(CompanyType)
  type!: CompanyType;

  @ApiProperty({ description: 'Contact email', example: 'admin@abc-property.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Contact phone', example: '+60123456789' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone!: string;

  @ApiPropertyOptional({ description: 'Company address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
