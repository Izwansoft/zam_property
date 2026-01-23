import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { VendorStatus, VendorType } from '@prisma/client';

export class VendorResponseDto {
  @ApiProperty({ description: 'Vendor ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Tenant ID', format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ description: 'Vendor name', example: 'ABC Property Agency' })
  name!: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'abc-property-agency' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Vendor description' })
  description?: string | null;

  @ApiProperty({ description: 'Vendor type', enum: VendorType })
  vendorType!: VendorType;

  @ApiPropertyOptional({ description: 'Contact email' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Contact phone' })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string | null;

  @ApiProperty({ description: 'Vendor status', enum: VendorStatus })
  status!: VendorStatus;

  @ApiPropertyOptional({ description: 'Verification timestamp' })
  verifiedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Approval timestamp' })
  approvedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Rejection timestamp' })
  rejectedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export class VendorDetailResponseDto extends VendorResponseDto {
  @ApiPropertyOptional({ description: 'Vendor profile details' })
  profile?: {
    businessRegNo?: string | null;
    taxId?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    socialLinks?: Prisma.JsonValue | null;
    operatingHours?: Prisma.JsonValue | null;
  } | null;

  @ApiPropertyOptional({ description: 'Vendor settings' })
  settings?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    leadNotifications?: boolean;
    autoResponseEnabled?: boolean;
    autoResponseMessage?: string | null;
    showPhone?: boolean;
    showEmail?: boolean;
  } | null;
}
