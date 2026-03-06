import { ArrayNotEmpty, IsArray, IsIn, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkProcessBillsDto {
  @ApiProperty({
    description: 'Array of billing IDs to process',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  billingIds!: string[];

  @ApiProperty({
    description: 'Action to perform: "send" or "write-off"',
    enum: ['send', 'write-off'],
  })
  @IsString()
  @IsIn(['send', 'write-off'])
  action!: 'send' | 'write-off';
}
