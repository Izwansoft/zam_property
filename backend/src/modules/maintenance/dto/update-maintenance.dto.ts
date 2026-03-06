import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAINTENANCE_CATEGORIES, PAID_BY_OPTIONS } from './create-maintenance.dto';

/**
 * DTO for updating a maintenance ticket
 */
export class UpdateMaintenanceDto {
  @ApiPropertyOptional({
    description: 'Updated title',
    example: 'Leaking kitchen faucet - urgent',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'The kitchen faucet has been dripping continuously and is getting worse.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category of maintenance issue',
    enum: MAINTENANCE_CATEGORIES,
    example: 'PLUMBING',
  })
  @IsOptional()
  @IsString()
  @IsIn(MAINTENANCE_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({
    description: 'Room or area in the property',
    example: 'Kitchen',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    example: 'HIGH',
  })
  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost of repair',
    example: 200.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Actual cost of repair',
    example: 180.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Who pays for the maintenance',
    enum: PAID_BY_OPTIONS,
    example: 'OWNER',
  })
  @IsOptional()
  @IsString()
  @IsIn(PAID_BY_OPTIONS)
  paidBy?: string;

  @ApiPropertyOptional({
    description: 'Assigned staff or contractor name/ID',
    example: 'John the Plumber',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Resolution description',
    example: 'Replaced faucet cartridge and tested for leaks',
  })
  @IsOptional()
  @IsString()
  resolution?: string;
}
