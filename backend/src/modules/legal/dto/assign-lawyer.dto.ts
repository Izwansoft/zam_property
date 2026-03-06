import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignLawyerDto {
  @ApiProperty({ description: 'Panel lawyer ID to assign' })
  @IsNotEmpty()
  @IsUUID()
  lawyerId!: string;
}
