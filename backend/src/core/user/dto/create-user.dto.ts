import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'TempPassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  fullName!: string;

  @ApiPropertyOptional({ example: '+60123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: Role,
    example: Role.CUSTOMER,
    description: 'Defaults to CUSTOMER when omitted.',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Defaults to ACTIVE when omitted.',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
