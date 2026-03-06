import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  IsDateString,
} from 'class-validator';

export const INSPECTION_TYPES = [
  'MOVE_IN',
  'PERIODIC',
  'MOVE_OUT',
  'EMERGENCY',
] as const;

export type InspectionTypeValue = (typeof INSPECTION_TYPES)[number];

export class CreateInspectionDto {
  @ApiProperty({ description: 'Tenancy ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  tenancyId!: string;

  @ApiProperty({
    description: 'Inspection type',
    enum: INSPECTION_TYPES,
    example: 'PERIODIC',
  })
  @IsIn(INSPECTION_TYPES)
  @IsNotEmpty()
  type!: InspectionTypeValue;

  @ApiPropertyOptional({ description: 'Scheduled date', example: '2025-03-15' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Scheduled time slot', example: '10:00-12:00' })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiPropertyOptional({ description: 'Whether video inspection is requested', default: false })
  @IsOptional()
  @IsBoolean()
  videoRequested?: boolean;

  @ApiPropertyOptional({ description: 'Whether onsite inspection is required', default: false })
  @IsOptional()
  @IsBoolean()
  onsiteRequired?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
