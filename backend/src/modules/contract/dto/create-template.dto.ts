import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a contract template.
 */
export class CreateContractTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Standard Residential Tenancy Agreement',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'Standard template for residential property tenancies',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Template content (HTML or Markdown with variables)',
    example: '<h1>Tenancy Agreement</h1><p>This agreement is between {{ownerName}} and {{tenantName}}...</p>',
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: 'List of available template variables',
    example: ['ownerName', 'tenantName', 'propertyAddress', 'rentAmount', 'depositAmount', 'startDate', 'endDate'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({
    description: 'Whether this is the default template',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
