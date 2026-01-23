import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveVendorDto {
  @ApiPropertyOptional({
    description: 'Optional approval notes',
    example: 'Documents verified',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class RejectVendorDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Invalid business registration documents',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class SuspendVendorDto {
  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Terms of service violation',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class ReactivateVendorDto {
  @ApiPropertyOptional({
    description: 'Optional notes for reactivation',
    example: 'Issue resolved after review',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
