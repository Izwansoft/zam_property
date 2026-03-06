import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisputeClaimDto {
  @ApiProperty({ description: 'Reason for disputing the claim decision' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Additional notes for the dispute' })
  @IsString()
  @IsOptional()
  notes?: string;
}
