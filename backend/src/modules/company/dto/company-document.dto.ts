/**
 * CompanyDocumentDto
 * Session 8.1 Extension - Company Document Management
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { CompanyDocumentType } from '@prisma/client';

export class CreateCompanyDocumentDto {
  @ApiProperty({
    description: 'Document type',
    enum: CompanyDocumentType,
  })
  @IsEnum(CompanyDocumentType)
  type!: CompanyDocumentType;

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName!: string;

  @ApiProperty({ description: 'File URL (S3 or storage URL)' })
  @IsString()
  fileUrl!: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  fileSize!: number;

  @ApiProperty({ description: 'MIME type', example: 'application/pdf' })
  @IsString()
  mimeType!: string;

  @ApiPropertyOptional({ description: 'Document expiry date (for licenses)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class VerifyCompanyDocumentDto {
  @ApiProperty({ description: 'Verification status' })
  verified!: boolean;
}
