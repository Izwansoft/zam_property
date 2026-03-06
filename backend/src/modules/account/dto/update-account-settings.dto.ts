import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PrivacyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showProfile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;
}

export class UpdateAccountSettingsDto {
  @ApiPropertyOptional({
    description: 'Preferred language',
    enum: ['en', 'ms', 'zh'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'ms', 'zh'])
  language?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    enum: ['Asia/Kuala_Lumpur', 'Asia/Singapore', 'UTC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['Asia/Kuala_Lumpur', 'Asia/Singapore', 'UTC'])
  timezone?: string;

  @ApiPropertyOptional({ description: 'Privacy settings', type: PrivacyDto })
  @IsOptional()
  @Type(() => PrivacyDto)
  privacy?: PrivacyDto;
}
