import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class BulkReindexRequestDto {
  @ApiProperty({ enum: ['listing', 'vendor'], example: 'listing' })
  @IsIn(['listing', 'vendor'])
  entityType!: 'listing' | 'vendor';

  @ApiPropertyOptional({
    description: 'Optional vertical type filter (listings only)',
    example: 'real_estate',
  })
  @IsString()
  @IsOptional()
  verticalType?: string;

  @ApiPropertyOptional({ description: 'Batch size', example: 100, default: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(500)
  @IsOptional()
  batchSize?: number = 100;
}

export class BulkExpireListingsRequestDto {
  @ApiProperty({
    description: 'Listing IDs to expire (partner-scoped)',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  listingIds!: string[];

  @ApiPropertyOptional({
    description: 'Optional reason for expiration',
    example: 'Policy violation',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkActionResponseDto {
  @ApiProperty({ description: 'BullMQ job id', example: '123' })
  jobId!: string;
}
