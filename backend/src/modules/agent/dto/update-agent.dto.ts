import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'REN number (Malaysia Real Estate Negotiator)' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  renNumber?: string;

  @ApiPropertyOptional({ description: 'REN expiry date' })
  @IsOptional()
  @IsDateString()
  renExpiry?: string;
}
