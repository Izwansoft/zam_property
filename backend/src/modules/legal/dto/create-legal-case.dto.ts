import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LegalCaseReason {
  NON_PAYMENT = 'NON_PAYMENT',
  BREACH = 'BREACH',
  DAMAGE = 'DAMAGE',
  OTHER = 'OTHER',
}

export class CreateLegalCaseDto {
  @ApiProperty({ description: 'Tenancy ID this legal case relates to' })
  @IsNotEmpty()
  @IsUUID()
  tenancyId!: string;

  @ApiProperty({ description: 'Reason for legal case', enum: LegalCaseReason })
  @IsNotEmpty()
  @IsEnum(LegalCaseReason)
  reason!: LegalCaseReason;

  @ApiProperty({ description: 'Detailed description of the case' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ description: 'Amount owed (RM)', example: 5000 })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountOwed!: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
