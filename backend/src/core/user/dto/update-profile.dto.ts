import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for self-service profile update (PATCH /users/me).
 * Only allows fullName and phone — no role or status changes.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Full name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+60123456789' })
  @IsOptional()
  @IsString()
  phone?: string;
}
