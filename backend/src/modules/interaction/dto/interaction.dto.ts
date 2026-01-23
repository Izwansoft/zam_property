import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InteractionType, InteractionStatus } from '@prisma/client';

/**
 * DTO for creating an interaction
 */
export class CreateInteractionDto {
  @ApiProperty({ description: 'Vendor ID' })
  @IsUUID()
  vendorId!: string;

  @ApiProperty({ description: 'Listing ID' })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ description: 'Vertical type' })
  @IsString()
  verticalType!: string;

  @ApiProperty({
    description: 'Interaction type',
    enum: InteractionType,
  })
  @IsEnum(InteractionType)
  interactionType!: InteractionType;

  @ApiProperty({ description: 'Contact name' })
  @IsString()
  contactName!: string;

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  contactEmail!: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Message' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Booking data (for booking type)' })
  @IsObject()
  @IsOptional()
  bookingData?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Source',
    default: 'web',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Referrer URL' })
  @IsString()
  @IsOptional()
  referrer?: string;
}

/**
 * DTO for updating interaction status
 */
export class UpdateInteractionStatusDto {
  @ApiProperty({
    description: 'New status',
    enum: InteractionStatus,
  })
  @IsEnum(InteractionStatus)
  status!: InteractionStatus;
}

/**
 * DTO for adding a message to an interaction
 */
export class AddMessageDto {
  @ApiProperty({
    description: 'Sender type',
    enum: ['vendor', 'customer', 'system'],
  })
  @IsEnum(['vendor', 'customer', 'system'])
  senderType!: 'vendor' | 'customer' | 'system';

  @ApiPropertyOptional({ description: 'Sender user ID (if applicable)' })
  @IsUUID()
  @IsOptional()
  senderId?: string;

  @ApiProperty({ description: 'Sender name' })
  @IsString()
  senderName!: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'Is internal note (not visible to customer)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}

/**
 * DTO for querying interactions
 */
export class InteractionQueryDto {
  @ApiPropertyOptional({ description: 'Filter by vendor ID' })
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Filter by listing ID' })
  @IsUUID()
  @IsOptional()
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Filter by interaction type',
    enum: InteractionType,
  })
  @IsEnum(InteractionType)
  @IsOptional()
  interactionType?: InteractionType;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: InteractionStatus,
  })
  @IsEnum(InteractionStatus)
  @IsOptional()
  status?: InteractionStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  pageSize?: number;
}
