import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestVideoDto {
  @ApiPropertyOptional({ description: 'Message to tenant requesting video' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class SubmitVideoDto {
  @ApiProperty({
    description: 'Original file name of the video',
    example: 'inspection-video.mp4',
  })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({
    description: 'MIME type of the video file',
    example: 'video/mp4',
  })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 52428800,
  })
  @IsOptional()
  fileSize?: number;
}

export class ReviewVideoDto {
  @ApiProperty({
    description: 'Review decision: APPROVED or REQUEST_REDO',
    enum: ['APPROVED', 'REQUEST_REDO'],
    example: 'APPROVED',
  })
  @IsString()
  @IsNotEmpty()
  decision!: 'APPROVED' | 'REQUEST_REDO';

  @ApiPropertyOptional({ description: 'Review notes or reason for re-upload request' })
  @IsOptional()
  @IsString()
  notes?: string;
}
