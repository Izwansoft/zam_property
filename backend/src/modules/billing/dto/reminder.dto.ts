import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for manually sending a billing reminder.
 * If sequence is omitted, the next sequence is automatically determined.
 */
export class SendReminderDto {
  @ApiPropertyOptional({
    description: 'Reminder sequence (1-4). Auto-determined if omitted.',
    minimum: 1,
    maximum: 4,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  sequence?: number;
}
