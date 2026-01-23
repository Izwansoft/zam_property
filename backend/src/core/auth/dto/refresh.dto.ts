import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ minLength: 10, example: 'eyJhbG...' })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
