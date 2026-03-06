import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class RunScreeningDto {
  @ApiPropertyOptional({ description: 'Additional notes for screening' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateScreeningResultDto {
  @ApiProperty({ description: 'Screening score (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  screeningScore!: number;

  @ApiPropertyOptional({ description: 'Screening notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  screeningNotes?: string;
}
