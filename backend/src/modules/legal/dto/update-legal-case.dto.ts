import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLegalCaseDto {
  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Updated amount owed' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountOwed?: number;

  @ApiPropertyOptional({ description: 'Court date' })
  @IsOptional()
  @IsDateString()
  courtDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
