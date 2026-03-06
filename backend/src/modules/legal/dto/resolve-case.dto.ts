import { IsOptional, IsString, IsNumber, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveCaseDto {
  @ApiPropertyOptional({ description: 'Resolution description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;

  @ApiPropertyOptional({ description: 'Settlement amount (RM)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  settlementAmount?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
