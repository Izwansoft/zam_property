import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CompleteInspectionDto {
  @ApiProperty({
    description: 'Overall rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  overallRating!: number;

  @ApiPropertyOptional({ description: 'Summary notes for the inspection' })
  @IsOptional()
  @IsString()
  notes?: string;
}
