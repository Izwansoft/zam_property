import { IsUUID, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyRole } from '@prisma/client';

export class AddPropertyMemberDto {
  @ApiProperty({ description: 'User ID to add as property member' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Property role to assign', enum: PropertyRole })
  @IsEnum(PropertyRole)
  role!: PropertyRole;

  @ApiPropertyOptional({ description: 'Optional notes about this member assignment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
