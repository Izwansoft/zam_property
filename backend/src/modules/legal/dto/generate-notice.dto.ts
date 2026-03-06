import { IsNotEmpty, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NoticeType {
  FIRST_REMINDER = 'FIRST_REMINDER',
  SECOND_REMINDER = 'SECOND_REMINDER',
  LEGAL_NOTICE = 'LEGAL_NOTICE',
  TERMINATION_NOTICE = 'TERMINATION_NOTICE',
}

export class GenerateNoticeDto {
  @ApiProperty({ description: 'Type of notice to generate', enum: NoticeType })
  @IsNotEmpty()
  @IsEnum(NoticeType)
  type!: NoticeType;

  @ApiPropertyOptional({ description: 'Additional notes for the notice' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
