import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Supported attachment types
 */
export const ATTACHMENT_TYPES = ['IMAGE', 'VIDEO', 'DOCUMENT'] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

/**
 * DTO for adding an attachment to a maintenance ticket
 */
export class AddAttachmentDto {
  @ApiProperty({
    description: 'Type of attachment',
    enum: ATTACHMENT_TYPES,
    example: 'IMAGE',
  })
  @IsString()
  @IsIn(ATTACHMENT_TYPES)
  type!: AttachmentType;

  @ApiProperty({
    description: 'Original file name',
    example: 'kitchen_leak.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize!: number;
}

/**
 * DTO for adding a comment/update to a maintenance ticket
 */
export class AddUpdateDto {
  @ApiProperty({
    description: 'Comment or update message',
    example: 'Plumber has been contacted and will visit tomorrow at 10am.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    description: 'Whether this is an internal note (hidden from tenant)',
    example: false,
    default: false,
  })
  @IsOptional()
  isInternal?: boolean;
}
