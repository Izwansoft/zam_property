import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewClaimDto {
  @ApiProperty({
    description: 'Review decision',
    enum: ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'],
  })
  @IsString()
  @IsNotEmpty()
  decision!: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Approved amount (required for PARTIALLY_APPROVED)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  approvedAmount?: number;

  @ApiPropertyOptional({ description: 'Review notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
