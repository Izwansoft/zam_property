import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveListingDto {
  @ApiProperty({ description: 'Listing ID to save' })
  @IsString()
  @IsUUID()
  listingId!: string;
}
