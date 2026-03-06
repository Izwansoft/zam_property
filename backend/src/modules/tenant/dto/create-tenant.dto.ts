import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';

export enum EmploymentType {
  EMPLOYED = 'EMPLOYED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  STUDENT = 'STUDENT',
  RETIRED = 'RETIRED',
  UNEMPLOYED = 'UNEMPLOYED',
}

export class CreateTenantDto {
  @ApiProperty({ description: 'User ID to link tenant profile to' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Employment type', enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: 'Monthly income in MYR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number;

  @ApiPropertyOptional({ description: 'Employer name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  employer?: string;

  @ApiPropertyOptional({ description: 'Malaysian IC number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  icNumber?: string;

  @ApiPropertyOptional({ description: 'Passport number (for foreigners)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({ description: 'Emergency contact relationship' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyRelation?: string;
}
