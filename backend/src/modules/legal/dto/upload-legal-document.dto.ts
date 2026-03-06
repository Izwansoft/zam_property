/**
 * Upload Legal Document DTO
 * Session 8.6 - Legal Integration & Finalization
 *
 * Used for uploading/attaching documents to a legal case.
 * Follows the presigned URL pattern used across the codebase.
 */

import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LegalDocumentType {
  NOTICE = 'NOTICE',
  RESPONSE = 'RESPONSE',
  COURT_FILING = 'COURT_FILING',
  JUDGMENT = 'JUDGMENT',
  FIRST_REMINDER = 'FIRST_REMINDER',
  SECOND_REMINDER = 'SECOND_REMINDER',
  LEGAL_NOTICE = 'LEGAL_NOTICE',
  TERMINATION_NOTICE = 'TERMINATION_NOTICE',
  EVIDENCE = 'EVIDENCE',
  CORRESPONDENCE = 'CORRESPONDENCE',
  SETTLEMENT = 'SETTLEMENT',
  OTHER = 'OTHER',
}

export class UploadLegalDocumentDto {
  @ApiProperty({ description: 'Document type', enum: LegalDocumentType })
  @IsEnum(LegalDocumentType)
  @IsNotEmpty()
  type!: LegalDocumentType;

  @ApiProperty({ description: 'Document title', example: 'First Payment Reminder' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @ApiProperty({ description: 'Original file name', example: 'notice_LEG12345678.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileName!: string;

  @ApiProperty({ description: 'File URL or storage key', example: '/legal-documents/partner-id/notice.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  fileUrl!: string;

  @ApiPropertyOptional({ description: 'Notes about the document' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
