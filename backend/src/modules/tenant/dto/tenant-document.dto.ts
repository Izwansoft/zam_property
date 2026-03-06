import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export enum TenantDocumentType {
  IC_FRONT = 'IC_FRONT',
  IC_BACK = 'IC_BACK',
  PAYSLIP = 'PAYSLIP',
  BANK_STATEMENT = 'BANK_STATEMENT',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  PASSPORT = 'PASSPORT',
  VISA = 'VISA',
  OTHER = 'OTHER',
}

export class RequestDocumentUploadDto {
  @ApiProperty({ description: 'Document type', enum: TenantDocumentType })
  @IsEnum(TenantDocumentType)
  type!: TenantDocumentType;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(1)
  size!: number;
}

export class ConfirmDocumentUploadDto {
  @ApiProperty({ description: 'Storage key returned from presigned URL request' })
  @IsString()
  storageKey!: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ description: 'Whether the document is verified' })
  verified!: boolean;

  @ApiPropertyOptional({ description: 'Notes about verification' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
