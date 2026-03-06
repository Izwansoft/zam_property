import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Maintenance categories
 */
export const MAINTENANCE_CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'APPLIANCE',
  'STRUCTURAL',
  'OTHER',
] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

/**
 * Who pays for maintenance
 */
export const PAID_BY_OPTIONS = ['OWNER', 'TENANT', 'SHARED'] as const;
export type PaidBy = (typeof PAID_BY_OPTIONS)[number];

/**
 * DTO for creating a maintenance ticket
 */
export class CreateMaintenanceDto {
  @ApiProperty({
    description: 'Tenancy ID this maintenance request relates to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenancyId!: string;

  @ApiProperty({
    description: 'Short title for the maintenance issue',
    example: 'Leaking kitchen faucet',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the maintenance issue',
    example: 'The kitchen faucet has been dripping continuously for the past 2 days.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Category of maintenance issue',
    enum: MAINTENANCE_CATEGORIES,
    example: 'PLUMBING',
  })
  @IsString()
  @IsIn(MAINTENANCE_CATEGORIES)
  category!: MaintenanceCategory;

  @ApiPropertyOptional({
    description: 'Room or area in the property where the issue is',
    example: 'Kitchen',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Priority level (defaults to MEDIUM)',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    example: 'HIGH',
  })
  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost of repair',
    example: 150.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost?: number;
}
