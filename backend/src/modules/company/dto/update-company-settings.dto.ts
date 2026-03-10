/**
 * UpdateCompanySettingsDto
 * Session 8.1 Extension - Company Settings Management
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsEmail, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCompanySettingsDto {
  // Commission settings
  @ApiPropertyOptional({ description: 'Default commission rate (%)', example: 3.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  defaultCommissionRate?: number;

  @ApiPropertyOptional({ description: 'Agent commission split (%)', example: 70.0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  commissionSplit?: number;

  // Notification settings
  @ApiPropertyOptional({ description: 'Notification email address' })
  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @ApiPropertyOptional({ description: 'Enable email alerts' })
  @IsOptional()
  @IsBoolean()
  enableEmailAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS alerts' })
  @IsOptional()
  @IsBoolean()
  enableSmsAlerts?: boolean;

  // Bank details
  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ description: 'Bank account holder name' })
  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @ApiPropertyOptional({ description: 'Bank SWIFT code' })
  @IsOptional()
  @IsString()
  bankSwiftCode?: string;
}
