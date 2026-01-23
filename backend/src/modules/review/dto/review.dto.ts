import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Target type (vendor or listing)',
    enum: ['vendor', 'listing'],
    example: 'vendor',
  })
  @IsString()
  @IsEnum(['vendor', 'listing'])
  targetType!: 'vendor' | 'listing';

  @ApiProperty({
    description: 'Target ID (vendor or listing UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  targetId!: string;

  @ApiProperty({
    description: 'Vertical type',
    example: 'real_estate',
  })
  @IsString()
  verticalType!: string;

  @ApiProperty({
    description: 'Anonymized reviewer reference',
    example: 'hash_abc123',
  })
  @IsString()
  reviewerRef!: string;

  @ApiProperty({
    description: 'Rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    description: 'Review title',
    example: 'Excellent service!',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Review content',
    example: 'Very professional and helpful. Highly recommended.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;
}

export class UpdateReviewStatusDto {
  @ApiProperty({
    description: 'Review status',
    enum: ReviewStatus,
    example: ReviewStatus.APPROVED,
  })
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Moderation note (internal)',
    example: 'Approved after verification',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationNote?: string;
}

export class AddVendorResponseDto {
  @ApiProperty({
    description: 'Vendor response text',
    example: 'Thank you for your feedback!',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  responseText!: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional({
    description: 'Target type filter',
    enum: ['vendor', 'listing'],
  })
  @IsOptional()
  @IsEnum(['vendor', 'listing'])
  targetType?: 'vendor' | 'listing';

  @ApiPropertyOptional({
    description: 'Target ID filter',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Status filter',
    enum: ReviewStatus,
  })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Rating filter (exact match)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}
