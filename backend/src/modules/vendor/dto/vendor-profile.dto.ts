import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateVendorProfileDto {
  @ApiPropertyOptional({
    description: 'Business registration number',
    example: 'BRN-12345678',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  businessRegNo?: string;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: 'TAX-12345678',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Suite 100',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Kuala Lumpur',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'Wilayah Persekutuan',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '50000',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'MY',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://cdn.example.com/logos/vendor-123.png',
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Banner URL',
    example: 'https://cdn.example.com/banners/vendor-123.jpg',
  })
  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Social media links',
    example: { facebook: 'https://facebook.com/abc', instagram: 'https://instagram.com/abc' },
  })
  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Operating hours',
    example: {
      mon: { open: '09:00', close: '18:00' },
      tue: { open: '09:00', close: '18:00' },
    },
  })
  @IsObject()
  @IsOptional()
  operatingHours?: Record<string, unknown>;
}

export class UpdateVendorSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable email notifications',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable SMS notifications',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable lead notifications',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  leadNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable auto-response',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  autoResponseEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-response message',
    example: 'Thank you for your inquiry. We will respond within 24 hours.',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  autoResponseMessage?: string;

  @ApiPropertyOptional({
    description: 'Show phone number publicly',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  showPhone?: boolean;

  @ApiPropertyOptional({
    description: 'Show email publicly',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  showEmail?: boolean;
}
