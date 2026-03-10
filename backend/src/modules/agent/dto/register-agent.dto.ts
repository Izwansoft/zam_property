import { IsString, IsUUID, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAgentDto {
  @ApiPropertyOptional({
    description: 'Company ID the agent belongs to (omit for independent agent)',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'User ID to register as agent' })
  @IsUUID()
  userId!: string;

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

  @ApiPropertyOptional({ description: 'Referred by agent ID' })
  @IsOptional()
  @IsUUID()
  referredBy?: string;
}
