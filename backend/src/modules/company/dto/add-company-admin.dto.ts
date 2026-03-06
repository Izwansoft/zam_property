import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyAdminRole } from '@prisma/client';

export class AddCompanyAdminDto {
  @ApiProperty({ description: 'User ID to add as admin', example: 'uuid-of-user' })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ enum: CompanyAdminRole, description: 'Admin role', default: 'ADMIN' })
  @IsOptional()
  @IsEnum(CompanyAdminRole)
  role?: CompanyAdminRole;

  @ApiPropertyOptional({ description: 'Is company owner?', default: false })
  @IsOptional()
  @IsBoolean()
  isOwner?: boolean;
}
