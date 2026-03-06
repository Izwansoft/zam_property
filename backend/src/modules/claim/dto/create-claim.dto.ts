import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsUUID, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType } from '@prisma/client';

export class CreateClaimDto {
  @ApiProperty({ description: 'Tenancy ID the claim relates to' })
  @IsUUID()
  @IsNotEmpty()
  tenancyId!: string;

  @ApiPropertyOptional({ description: 'Optional maintenance ticket ID' })
  @IsUUID()
  @IsOptional()
  maintenanceId?: string;

  @ApiProperty({ enum: ['DAMAGE', 'CLEANING', 'MISSING_ITEM', 'UTILITY', 'OTHER'] })
  @IsEnum(ClaimType)
  type!: ClaimType;

  @ApiProperty({ description: 'Claim title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Detailed claim description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Amount being claimed', example: 500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  claimedAmount!: number;

  @ApiProperty({ description: 'Who is submitting: OWNER or TENANT', enum: ['OWNER', 'TENANT'] })
  @IsIn(['OWNER', 'TENANT'])
  submittedRole!: string;
}
