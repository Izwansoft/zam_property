import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorStatus, VendorType, UserVendorRole } from '@prisma/client';

export class VendorMyApplicationDto {
  @ApiProperty({ description: 'Vendor ID', format: 'uuid' })
  vendorId!: string;

  @ApiProperty({ description: 'Vendor display name' })
  vendorName!: string;

  @ApiPropertyOptional({ description: 'Vendor slug' })
  vendorSlug?: string;

  @ApiPropertyOptional({ description: 'Vertical type', example: 'PROPERTY' })
  verticalType?: string | null;

  @ApiProperty({ description: 'Vendor type', enum: VendorType })
  vendorType!: VendorType;

  @ApiProperty({ description: 'Application status', enum: VendorStatus })
  status!: VendorStatus;

  @ApiProperty({ description: 'User role in vendor membership', enum: UserVendorRole })
  userVendorRole!: UserVendorRole;

  @ApiProperty({ description: 'Whether this is primary vendor for user' })
  isPrimary!: boolean;

  @ApiProperty({ description: 'Membership created at timestamp' })
  linkedAt!: Date;

  @ApiProperty({ description: 'Application last updated timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Vendor rejection reason when status is REJECTED' })
  rejectionReason?: string | null;
}
