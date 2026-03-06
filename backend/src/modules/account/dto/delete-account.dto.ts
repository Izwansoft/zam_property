import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({ description: 'Current password for confirmation' })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiPropertyOptional({ description: 'Reason for account deletion' })
  @IsOptional()
  @IsString()
  reason?: string;
}
