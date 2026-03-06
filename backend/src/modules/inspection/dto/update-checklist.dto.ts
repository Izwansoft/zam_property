import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const INSPECTION_CATEGORIES = [
  'BEDROOM',
  'BATHROOM',
  'KITCHEN',
  'LIVING',
  'EXTERIOR',
  'OTHER',
] as const;

export type InspectionCategoryValue = (typeof INSPECTION_CATEGORIES)[number];

export const ITEM_CONDITIONS = [
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
] as const;

export type ItemConditionValue = (typeof ITEM_CONDITIONS)[number];

export class ChecklistItemDto {
  @ApiPropertyOptional({
    description: 'Existing item ID (omit for new items)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Item category',
    enum: INSPECTION_CATEGORIES,
    example: 'BEDROOM',
  })
  @IsIn(INSPECTION_CATEGORIES)
  @IsNotEmpty()
  category!: InspectionCategoryValue;

  @ApiProperty({
    description: 'Item name',
    example: 'Wall condition',
  })
  @IsString()
  @IsNotEmpty()
  item!: string;

  @ApiPropertyOptional({
    description: 'Item condition rating',
    enum: ITEM_CONDITIONS,
    example: 'GOOD',
  })
  @IsOptional()
  @IsIn(ITEM_CONDITIONS)
  condition?: ItemConditionValue;

  @ApiPropertyOptional({ description: 'Notes about this item' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Array of photo URLs for this item',
    example: ['https://s3.example.com/photo1.jpg'],
  })
  @IsOptional()
  @IsArray()
  photoUrls?: string[];
}

export class UpdateChecklistDto {
  @ApiProperty({
    description: 'Checklist items to create/update',
    type: [ChecklistItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items!: ChecklistItemDto[];
}
