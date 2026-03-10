/**
 * UpdateCompanyBrandingDto
 * Session 8.1 Extension - Company Branding Management
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateCompanyBrandingDto {
  @ApiPropertyOptional({ description: 'Main logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Square icon URL' })
  @IsOptional()
  @IsString()
  logoIcon?: string;

  @ApiPropertyOptional({ description: 'Dark mode logo URL' })
  @IsOptional()
  @IsString()
  logoDark?: string;

  @ApiPropertyOptional({ description: 'Favicon URL' })
  @IsOptional()
  @IsString()
  favicon?: string;

  @ApiPropertyOptional({ description: 'Primary brand color (hex)', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'primaryColor must be a valid hex color (e.g., #3B82F6)',
  })
  primaryColor?: string;
}
