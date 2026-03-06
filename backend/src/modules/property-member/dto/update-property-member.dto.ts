import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyRole } from '@prisma/client';

export class UpdatePropertyMemberDto {
  @ApiPropertyOptional({ description: 'Updated property role', enum: PropertyRole })
  @IsOptional()
  @IsEnum(PropertyRole)
  role?: PropertyRole;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
