import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadEvidenceDto {
  @ApiProperty({ description: 'Evidence type', enum: ['PHOTO', 'VIDEO', 'RECEIPT', 'QUOTE'] })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(104857600) // 100MB
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Description of the evidence' })
  @IsString()
  @IsOptional()
  description?: string;
}
