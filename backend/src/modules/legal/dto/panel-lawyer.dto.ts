import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePanelLawyerDto {
  @ApiProperty({ description: 'Lawyer name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Law firm name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  firm?: string;

  @ApiProperty({ description: 'Lawyer email' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Lawyer phone' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone!: string;

  @ApiPropertyOptional({ description: 'Areas of specialization', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialization?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdatePanelLawyerDto {
  @ApiPropertyOptional({ description: 'Lawyer name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Law firm name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  firm?: string;

  @ApiPropertyOptional({ description: 'Lawyer email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Lawyer phone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Areas of specialization', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialization?: string[];

  @ApiPropertyOptional({ description: 'Whether the lawyer is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
