import { IsString, IsEmail, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType } from '@prisma/client';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: CompanyType, description: 'Company type' })
  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Company address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Business license document URL (S3)' })
  @IsOptional()
  @IsString()
  businessLicense?: string;

  @ApiPropertyOptional({ description: 'SSM document URL (S3)' })
  @IsOptional()
  @IsString()
  ssmDocument?: string;
}
