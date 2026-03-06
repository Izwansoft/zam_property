import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignListingDto {
  @ApiProperty({ description: 'Listing ID to assign to agent' })
  @IsUUID()
  listingId!: string;
}
