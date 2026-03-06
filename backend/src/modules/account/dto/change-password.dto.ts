import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ description: 'New password (min 8 chars)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;

  @ApiProperty({ description: 'Confirm new password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  confirmPassword!: string;
}
