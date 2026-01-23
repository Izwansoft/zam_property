import { ApiProperty } from '@nestjs/swagger';
import { VendorStatus, VendorType } from '@prisma/client';

export class AdminVendorDashboardItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: VendorType })
  vendorType!: VendorType;

  @ApiProperty({ enum: VendorStatus })
  status!: VendorStatus;

  @ApiProperty({ example: 5 })
  listingsCount!: number;

  @ApiProperty({ example: 12 })
  interactionsCount!: number;

  @ApiProperty({ example: 3 })
  reviewsCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
