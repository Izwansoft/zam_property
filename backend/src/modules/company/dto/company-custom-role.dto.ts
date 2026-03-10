/**
 * CompanyCustomRoleDto
 * Session 8.1 Extension - Company RBAC Management
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, MinLength, MaxLength, ArrayMinSize } from 'class-validator';

export class CreateCompanyCustomRoleDto {
  @ApiProperty({ description: 'Role name', example: 'Senior Agent' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({
    description: 'Permission keys',
    example: ['agents.view', 'agents.create', 'listings.view', 'listings.create'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissions!: string[];
}

export class UpdateCompanyCustomRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    description: 'Permission keys',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class AssignCustomRoleDto {
  @ApiProperty({ description: 'Company admin ID' })
  @IsString()
  companyAdminId!: string;

  @ApiProperty({ description: 'Custom role ID' })
  @IsString()
  customRoleId!: string;
}

/**
 * Available permissions for company custom roles
 */
export const COMPANY_PERMISSIONS = {
  // Agent management
  'agents.view': 'View agents',
  'agents.create': 'Create agents',
  'agents.update': 'Update agents',
  'agents.delete': 'Delete agents',
  'agents.assign': 'Assign listings to agents',

  // Listing management
  'listings.view': 'View assigned listings',
  'listings.create': 'Create listings',
  'listings.update': 'Update listings',
  'listings.delete': 'Delete listings',

  // Commission management
  'commissions.view': 'View commissions',
  'commissions.approve': 'Approve commissions',

  // Team management
  'team.view': 'View team members',
  'team.manage': 'Manage team members',

  // Reports
  'reports.view': 'View reports',
  'reports.export': 'Export reports',

  // Settings
  'settings.view': 'View company settings',
  'settings.update': 'Update company settings',

  // Documents
  'documents.view': 'View documents',
  'documents.upload': 'Upload documents',
  'documents.delete': 'Delete documents',
} as const;

export type CompanyPermission = keyof typeof COMPANY_PERMISSIONS;
